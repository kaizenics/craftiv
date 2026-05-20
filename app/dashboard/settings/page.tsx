
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "@/components/ui/icons";
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
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";

type SubscriptionPlan = "free" | "active" | "plus" | "pro";

function getPlanBenefits(plan: SubscriptionPlan): string[] {
  if (plan === "free") {
    return [
      "1 starter credit to try Craftiv",
      "Create and download your first resume",
      "Access to ATS-optimized templates",
      "No subscription required",
    ];
  }
  if (plan === "active") {
    return [
      "2 fully optimized resumes + 1 leftover review credit",
      "Job match score before and after with missing keywords",
      "AI-rewritten bullets tailored to job descriptions",
      "No subscription, credits never expire",
    ];
  }
  if (plan === "plus") {
    return [
      "6 fully optimized resumes",
      "Credits-based access to premium optimization tools",
      "Job match scoring with missing keyword insights",
      "AI-rewritten bullets tailored to job descriptions",
      "No subscription, credits never expire",
    ];
  }
  return [
    "Includes all premium features with maximum credit capacity",
    "Built for frequent applicants and career switchers",
    "Advanced AI optimization support",
    "No subscription, credits never expire",
  ];
}

function isAIBenefit(benefit: string): boolean {
  const normalized = benefit.toLowerCase();
  return normalized.includes("ai-");
}

export default function Settings() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const utils = trpc.useUtils();
  const { data: userProfile } = trpc.user.me.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const { data: providers } = trpc.user.getProviders.useQuery();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [autoSaveDrafts, setAutoSaveDrafts] = useState(true);
  const [defaultSpellCheck, setDefaultSpellCheck] = useState(true);
  const [compactEditor, setCompactEditor] = useState(false);
  const [showResumeScore, setShowResumeScore] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeDialogTitle, setNoticeDialogTitle] = useState("Notice");
  const [noticeDialogMessage, setNoticeDialogMessage] = useState("");
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  const deleteAccountMutation = trpc.user.deleteAccount.useMutation();
  const updateSettingsMutation = trpc.user.updateSettings.useMutation();
  const openNotice = (title: string, message: string) => {
    setNoticeDialogTitle(title);
    setNoticeDialogMessage(message);
    setNoticeDialogOpen(true);
  };

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
    if ((userProfile || session?.user) && !hasLoadedSettings) {
      const timer = window.setTimeout(() => {
        const fullName = userProfile?.name || session?.user?.name || "";
        const nameParts = fullName.trim().split(" ");
        if (nameParts.length > 1) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(" "));
        } else {
          setFirstName(fullName);
          setLastName("");
        }
        setEmail(userProfile?.email || session?.user?.email || "");
        setAutoSaveDrafts(userProfile?.autoSaveDrafts ?? DEFAULT_USER_PREFERENCES.autoSaveDrafts);
        setDefaultSpellCheck(userProfile?.defaultSpellCheck ?? DEFAULT_USER_PREFERENCES.defaultSpellCheck);
        setCompactEditor(userProfile?.compactEditor ?? DEFAULT_USER_PREFERENCES.compactEditor);
        setShowResumeScore(userProfile?.showResumeScore ?? DEFAULT_USER_PREFERENCES.showResumeScore);
        setHasLoadedSettings(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [hasLoadedSettings, session, userProfile]);

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

    try {
      await updateSettingsMutation.mutateAsync({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        preferences: {
          autoSaveDrafts,
          defaultSpellCheck,
          showResumeScore,
          compactEditor,
        },
      });
      await Promise.all([
        utils.user.me.invalidate(),
        utils.user.preferences.invalidate(),
      ]);
      router.refresh();
      openNotice("Settings Saved", `Name: ${fullName}\nEmail: ${trimmedEmail}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings.";
      openNotice("Save Failed", message);
    } finally {
      setSaving(false);
    }
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
      
      // Account is already deleted at this point; sign-out may fail if session no longer resolves.
      try {
        await authClient.signOut();
      } catch (signOutError) {
        console.warn("Sign out after account deletion failed:", signOutError);
      }
      
      // Redirect to home page
      setDeleteDialogOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete account:", error);
      openNotice("Delete Failed", "Failed to delete account. Please try again.");
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
      openNotice("Sign Out Failed", "Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  const subscriptionPlan = (subscription?.plan as SubscriptionPlan | undefined) ?? "free";
  const availableCredits = subscription?.creditBalance ?? 0;
  const resumesCreated = subscription?.resumeCreatedCount ?? 0;
  const coverLettersCreated = subscription?.coverLetterCreatedCount ?? 0;
  const approxAiSessionsLeft = Math.floor(availableCredits * 2);
  const currentPlanBenefits = getPlanBenefits(subscriptionPlan);

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
      <p className="text-muted-foreground mt-1 mb-8">Manage your account preferences</p>

      <form onSubmit={onSave} className="space-y-8">
        {/* Account Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Account</h2>

          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credits overview</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Billing model: one-time credit packs, no recurring subscription.
                </p>
                <div className="mt-4">
                  <p className="text-4xl font-bold leading-none text-foreground">
                    {availableCredits}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Available credits
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Approx. {approxAiSessionsLeft} AI sessions left (0.5 credit each).
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Documents created: {resumesCreated} resumes, {coverLettersCreated} cover letters.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/pricing"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Buy credits
                </Link>
              </div>
            </div>
            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Credit pack benefits
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your current perks and feature access under the credit system.
              </p>
              <div className="mt-3 space-y-2">
                {currentPlanBenefits.map((benefit) => (
                  <div
                    key={benefit}
                    className={`flex items-center gap-2.5 px-1 py-1.5 text-xs ${
                      isAIBenefit(benefit)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {!isOAuthUser && (
              <Link href="/dashboard/change-password" className="block text-sm text-foreground hover:text-muted-foreground transition-colors">
                Change password
              </Link>
            )}
          </div>
        </section>

        <Separator />

        {/* Profile Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Profile</h2>
          
          {isOAuthUser && providerInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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

        <Separator />

        {/* Preferences Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={receiveEmails} onCheckedChange={setReceiveEmails} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Auto-save drafts</p>
                <p className="text-xs text-muted-foreground">Automatically save resume changes while editing</p>
              </div>
              <Switch checked={autoSaveDrafts} onCheckedChange={setAutoSaveDrafts} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Enable spell check by default</p>
                <p className="text-xs text-muted-foreground">Open resume editor with spell check panel enabled</p>
              </div>
              <Switch checked={defaultSpellCheck} onCheckedChange={setDefaultSpellCheck} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Show resume score in preview</p>
                <p className="text-xs text-muted-foreground">Display score badge at the top of resume preview</p>
              </div>
              <Switch checked={showResumeScore} onCheckedChange={setShowResumeScore} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Compact editor mode</p>
                <p className="text-xs text-muted-foreground">Use denser spacing in editor forms for faster scanning</p>
              </div>
              <Switch checked={compactEditor} onCheckedChange={setCompactEditor} />
            </div>
          </div>
        </section>

        <div>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>

        <div>
          <Separator className="mb-6" />
          <div className="space-y-3">
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="block text-sm text-foreground hover:text-muted-foreground transition-colors disabled:opacity-50"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>

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
        </div>
      </form>

      <AlertDialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{noticeDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {noticeDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNoticeDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
