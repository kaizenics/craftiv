import { Polar } from "@polar-sh/sdk";

export type CheckoutPlan = "active" | "plus" | "pro";
export type InternalPlan = "active" | "plus" | "pro";

const PLAN_TO_INTERNAL: Record<CheckoutPlan, InternalPlan> = {
  active: "active",
  plus: "plus",
  pro: "pro",
};

const REQUIRED_ENV = {
  accessToken: "POLAR_ACCESS_TOKEN",
  activeProductId: "POLAR_PRODUCT_ID_ACTIVE",
  plusProductId: "POLAR_PRODUCT_ID_PLUS",
  proProductId: "POLAR_PRODUCT_ID_PRO",
} as const;

/** Polar keeps sandbox and production fully separate: different dashboard, tokens and product IDs. */
export type PolarServer = "sandbox" | "production";

export function getPolarServer(): PolarServer {
  const value = process.env.POLAR_SERVER?.trim().toLowerCase();
  if (value === "production") return "production";
  if (value === "sandbox" || !value) return "sandbox";
  throw new Error('POLAR_SERVER must be either "sandbox" or "production"');
}

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseProductId(value: string, envName: string): string {
  // Polar product IDs are UUIDs; catch the common mistake of pasting a
  // checkout link or a product slug instead.
  const id = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error(
      `${envName} must be a Polar product ID (a UUID such as ` +
        `"9dbd4a83-1b1a-4f3a-b4a1-6a5e7f0e6f2c"), got "${id}"`,
    );
  }
  return id;
}

function getProductEnvNameForPlan(plan: CheckoutPlan): string {
  if (plan === "active") return REQUIRED_ENV.activeProductId;
  if (plan === "plus") return REQUIRED_ENV.plusProductId;
  return REQUIRED_ENV.proProductId;
}

export function validatePolarConfig(): void {
  readEnv(REQUIRED_ENV.accessToken);
  getPolarServer();
  parseProductId(readEnv(REQUIRED_ENV.activeProductId), REQUIRED_ENV.activeProductId);
  parseProductId(readEnv(REQUIRED_ENV.plusProductId), REQUIRED_ENV.plusProductId);
  parseProductId(readEnv(REQUIRED_ENV.proProductId), REQUIRED_ENV.proProductId);
}

export function toInternalPlan(plan: CheckoutPlan): InternalPlan {
  return PLAN_TO_INTERNAL[plan];
}

export function getProductIdForPlan(plan: CheckoutPlan): string {
  const envName = getProductEnvNameForPlan(plan);
  return parseProductId(readEnv(envName), envName);
}

/** Reverse lookup for webhooks that arrive without our checkout metadata. */
export function getProductPlanMap(): Map<string, InternalPlan> {
  return new Map<string, InternalPlan>([
    [getProductIdForPlan("active"), "active"],
    [getProductIdForPlan("plus"), "plus"],
    [getProductIdForPlan("pro"), "pro"],
  ]);
}

export function getPolarClient(): Polar {
  return new Polar({
    accessToken: readEnv(REQUIRED_ENV.accessToken),
    server: getPolarServer(),
  });
}

type CreateCheckoutInput = {
  userId: string;
  userEmail: string;
  plan: CheckoutPlan;
  successUrl: string;
};

export async function createPolarCheckout(input: CreateCheckoutInput): Promise<string> {
  const productId = getProductIdForPlan(input.plan);
  const internalPlan = toInternalPlan(input.plan);
  const polar = getPolarClient();

  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: input.successUrl,
    customerEmail: input.userEmail,
    // Links the Polar customer to our user, so later orders resolve back to the
    // right account even when the checkout metadata is missing.
    externalCustomerId: input.userId,
    metadata: {
      user_id: input.userId,
      requested_plan: input.plan,
      internal_plan: internalPlan,
    },
  });

  if (!checkout.url) {
    throw new Error("Polar response did not include a checkout URL");
  }

  return checkout.url;
}
