
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

export default function Settings() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: providers } = trpc.user.getProviders.useQuery();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [monochrome, setMonochrome] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccountMutation = trpc.user.deleteAccount.useMutation();

  // Check if user is using OAuth (has google, github, etc. - not credential)
  // Email/password users either have no accounts or only 'credential' provider
  const isOAuthUser = providers && providers.length > 0 && providers.some(
    p => p.providerId === 'google'
  );
  const oauthProvider = providers?.find(
    p => p.providerId === 'google'
  )?.providerId;

  // Populate form with user data from session
  useEffect(() => {
    if (session?.user) {
      // Split name into firstName and lastName
      const fullName = session.user.name || "";
      const nameParts = fullName.trim().split(" ");
      if (nameParts.length > 1) {
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(" "));
      } else {
        setFirstName(fullName);
        setLastName("");
      }
      setEmail(session.user.email || "");
    }
  }, [session]);

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    // Combine firstName and lastName for saving
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    alert(`Settings saved (mock)\nName: ${fullName}\nEmail: ${email}`);
  };

  // Get provider display info
  const getProviderInfo = (providerId: string | undefined) => {
    switch (providerId) {
      case 'google':
        return {
          name: 'Google',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          ),
        };
      default:
        return null;
    }
  };

  const providerInfo = getProviderInfo(oauthProvider);

  const onDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      await deleteAccountMutation.mutateAsync();
      
      // Sign out the user
      await authClient.signOut();
      
      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <p className="text-muted-foreground mt-1 mb-8">Manage your account preferences</p>

      <form onSubmit={onSave} className="space-y-8">
        {/* Profile Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Profile</h2>
          
          {isOAuthUser && providerInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
              {providerInfo.icon}
              <span>Connected with {providerInfo.name}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-foreground">First name</label>
              <Input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Jane"
                disabled={isOAuthUser}
                className={`w-64 ${isOAuthUser ? "opacity-50" : ""}`}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-foreground">Last name</label>
              <Input 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Doe"
                disabled={isOAuthUser}
                className={`w-64 ${isOAuthUser ? "opacity-50" : ""}`}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-foreground">Email</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com"
                disabled={isOAuthUser}
                className={`w-64 ${isOAuthUser ? "opacity-50" : ""}`}
              />
            </div>
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Preferences Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Monochrome theme</p>
                <p className="text-xs text-muted-foreground">Use black & white theme</p>
              </div>
              <Switch checked={monochrome} onCheckedChange={setMonochrome} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={receiveEmails} onCheckedChange={setReceiveEmails} />
            </div>
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Account Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Account</h2>
          
          <div className="space-y-3">
            {!isOAuthUser && (
              <Link href="/dashboard/change-password" className="block text-sm text-foreground hover:text-muted-foreground transition-colors">
                Change password
              </Link>
            )}
            <Link href="/logout" className="block text-sm text-foreground hover:text-muted-foreground transition-colors">
              Sign out
            </Link>
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <button 
                  type="button"
                  className="text-sm text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Delete account
                </button>
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
                      <li>Your login credentials</li>
                    </ul>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      onDeleteAccount();
                    }}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <div className="border-t border-border pt-6">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}