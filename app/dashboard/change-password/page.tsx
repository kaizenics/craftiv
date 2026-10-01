import { redirect } from "next/navigation";

// Moved under Settings → Account; kept so old links still land.
export default function ChangePasswordRedirect() {
  redirect("/dashboard/settings/account/change-password");
}
