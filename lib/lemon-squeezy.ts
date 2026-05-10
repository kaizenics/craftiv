export type CheckoutPlan = "active" | "plus" | "pro";
export type InternalPlan = "active" | "plus" | "pro";

const PLAN_TO_INTERNAL: Record<CheckoutPlan, InternalPlan> = {
  active: "active",
  plus: "plus",
  pro: "pro",
};

const REQUIRED_ENV = {
  apiKey: "LEMON_SQUEEZY_API_KEY",
  storeId: "LEMON_SQUEEZY_STORE_ID",
  activeVariantId: "LEMON_SQUEEZY_VARIANT_ID_ACTIVE",
  plusVariantId: "LEMON_SQUEEZY_VARIANT_ID_PLUS",
  proVariantId: "LEMON_SQUEEZY_VARIANT_ID_PRO",
} as const;

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseVariantId(value: string, envName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${envName} must be a positive integer`);
  }
  return parsed;
}

export function toInternalPlan(plan: CheckoutPlan): InternalPlan {
  return PLAN_TO_INTERNAL[plan];
}

export function getVariantIdForPlan(plan: CheckoutPlan): number {
  if (plan === "active") {
    return parseVariantId(
      readEnv(REQUIRED_ENV.activeVariantId),
      REQUIRED_ENV.activeVariantId
    );
  }
  if (plan === "plus") {
    return parseVariantId(
      readEnv(REQUIRED_ENV.plusVariantId),
      REQUIRED_ENV.plusVariantId
    );
  }
  return parseVariantId(
    readEnv(REQUIRED_ENV.proVariantId),
    REQUIRED_ENV.proVariantId
  );
}

export function getVariantPlanMap(): Map<number, InternalPlan> {
  return new Map<number, InternalPlan>([
    [getVariantIdForPlan("active"), "active"],
    [getVariantIdForPlan("plus"), "plus"],
    [getVariantIdForPlan("pro"), "pro"],
  ]);
}

type CreateCheckoutInput = {
  userId: string;
  userEmail: string;
  plan: CheckoutPlan;
  successUrl: string;
};

export async function createLemonSqueezyCheckout(
  input: CreateCheckoutInput
): Promise<string> {
  const apiKey = readEnv(REQUIRED_ENV.apiKey);
  const storeId = readEnv(REQUIRED_ENV.storeId);
  const variantId = getVariantIdForPlan(input.plan);
  const internalPlan = toInternalPlan(input.plan);

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
        },
        checkout_data: {
          email: input.userEmail,
          custom: {
            user_id: input.userId,
            requested_plan: input.plan,
            internal_plan: internalPlan,
          },
        },
        product_options: {
          redirect_url: input.successUrl,
          receipt_button_text: "Return to Craftiv",
          receipt_link_url: input.successUrl,
        },
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: String(variantId),
          },
        },
      },
    },
  };

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Lemon Squeezy checkout creation failed (${response.status}): ${errorText}`
    );
  }

  const json = (await response.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const checkoutUrl = json.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error("Lemon Squeezy response did not include a checkout URL");
  }
  return checkoutUrl;
}
