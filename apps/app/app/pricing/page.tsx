import { PricingClient } from "./pricing-client";

export const metadata = {
  title: "Pricing | Craftiv",
  description:
    "Simple pricing for Craftiv resume and cover letter tools. Pay securely with Paddle.",
};

export default function PricingPage() {
  return <PricingClient />;
}
