import { redirect } from "next/navigation";

/**
 * Settings is split into Profile, Preferences, Integrations and Account pages.
 * This path stays because links already point at it: email-change confirmation
 * emails, and the POLAR_SUCCESS_URL a deployment may still have configured.
 * Profile is where those should land, since it shows the credit balance.
 */
export default function SettingsIndex() {
  redirect("/dashboard/settings/profile");
}
