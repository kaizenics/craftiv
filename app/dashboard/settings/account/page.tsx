"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";

export default function AccountSettings() {
  const router = useRouter();
  const { data: providers } = trpc.user.getProviders.useQuery();
  const { data: session } = authClient.useSession();
  const accountEmail = session?.user?.email ?? "";
  const deleteAccountMutation = trpc.user.deleteAccount.useMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const emailConfirmed =
    !!accountEmail && confirmEmail.trim().toLowerCase() === accountEmail.toLowerCase();

  // Google accounts have no Craftiv password to change.
  const isOAuthUser = !!providers?.some((p) => p.providerId === "google");

  const onDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      await deleteAccountMutation.mutateAsync({ confirmEmail });

      // Account is already deleted at this point; sign-out may fail if session no longer resolves.
      try {
        await authClient.signOut();
      } catch (signOutError) {
        console.warn("Sign out after account deletion failed:", signOutError);
      }

      setDeleteDialogOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const onSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Account</h1>
      <p className="text-muted-foreground mt-1 mb-8">Sign-in and account management</p>

      <div className="space-y-8">
        {!isOAuthUser && (
          <>
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Password</h2>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Change the password you use to sign in.</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/settings/account/change-password">Change password</Link>
                </Button>
              </div>
            </section>
            <Separator />
          </>
        )}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Session</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Sign out of Craftiv on this device.</p>
            <Button type="button" variant="outline" onClick={onSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Danger zone</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and everything in it.
            </p>
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setConfirmEmail("");
              }}
            >
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                  <div className="space-y-2 pt-3">
                    <p className="text-sm font-medium text-foreground">
                      This includes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>All your resume drafts and completed resumes</li>
                      <li>Your profile information</li>
                      <li>All account settings and preferences</li>
                      <li>Your saved AI provider key</li>
                      <li>Your login credentials</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-3">
                    <label htmlFor="confirm-delete-email" className="text-sm font-medium text-foreground">
                      Type <span className="font-semibold">{accountEmail}</span> to confirm
                    </label>
                    <Input
                      id="confirm-delete-email"
                      type="email"
                      autoComplete="off"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      disabled={isDeleting}
                    />
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      onDeleteAccount();
                    }}
                    disabled={isDeleting || !emailConfirmed}
                    className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}
