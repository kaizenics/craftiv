"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditsOverview } from "@/components/dashboard/credits-overview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { AI_PROVIDERS } from "@/lib/ai-providers";
import { trpc } from "@/trpc/client";

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

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function ProfileSettings() {
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
  const { data: ownAi } = trpc.ownAi.get.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeDialogTitle, setNoticeDialogTitle] = useState("Notice");
  const [noticeDialogMessage, setNoticeDialogMessage] = useState("");

  const updateProfileMutation = trpc.user.updateProfile.useMutation();
  const openNotice = (title: string, message: string) => {
    setNoticeDialogTitle(title);
    setNoticeDialogMessage(message);
    setNoticeDialogOpen(true);
  };

  // Google accounts take their name and email from Google, so they are read-only here.
  const isOAuthUser = !!providers?.some((p) => p.providerId === "google");

  useEffect(() => {
    if ((userProfile || session?.user) && !hasLoadedProfile) {
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
        setHasLoadedProfile(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [hasLoadedProfile, session, userProfile]);

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

    try {
      const result = await updateProfileMutation.mutateAsync({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
      });
      await utils.user.me.invalidate();
      router.refresh();
      // An email change is not applied until the confirmation link is followed,
      // so the account still carries the old address here. Reporting the
      // requested one as saved would be a lie the user goes on to act on.
      if (result.emailChangePending) {
        setEmail(result.email);
        openNotice(
          "Confirm your new email",
          `Name: ${fullName}\n\nWe sent a confirmation link to ${result.email}. Your address stays ${result.email} until you open it.`,
        );
      } else {
        openNotice("Profile Saved", `Name: ${fullName}\nEmail: ${result.email}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save your profile.";
      openNotice("Save Failed", message);
    } finally {
      setSaving(false);
    }
  };

  const subscriptionPlan = (subscription?.plan as SubscriptionPlan | undefined) ?? "free";
  const activeOwnAi =
    ownAi?.unlocked && ownAi.connection?.enabled
      ? {
          providerLabel: AI_PROVIDERS[ownAi.connection.provider].label,
          model: ownAi.connection.model,
        }
      : null;

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Profile</h1>
      <p className="text-muted-foreground mt-1 mb-8">Your personal details and credits</p>

      <div className="space-y-8">
        <form onSubmit={onSave}>
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Personal info</h2>

            {isOAuthUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <GoogleIcon />
                <span>Connected with Google</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="profile-first-name" className="text-sm text-foreground">First name</label>
                <Input
                  id="profile-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  disabled={isOAuthUser}
                  className={`sm:w-64 ${isOAuthUser ? "opacity-50" : ""}`}
                />
              </div>
              <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="profile-last-name" className="text-sm text-foreground">Last name</label>
                <Input
                  id="profile-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  disabled={isOAuthUser}
                  className={`sm:w-64 ${isOAuthUser ? "opacity-50" : ""}`}
                />
              </div>
              <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="profile-email" className="text-sm text-foreground">Email</label>
                <Input
                  id="profile-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isOAuthUser}
                  className={`sm:w-64 ${isOAuthUser ? "opacity-50" : ""}`}
                />
              </div>
            </div>

            {!isOAuthUser && (
              <Button type="submit" disabled={saving} className="mt-4 w-full sm:w-auto">
                {saving ? "Saving..." : "Save profile"}
              </Button>
            )}
          </section>
        </form>

        <Separator />

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Credits</h2>
          <CreditsOverview
            ownAi={activeOwnAi}
            availableCredits={subscription?.creditBalance ?? 0}
            resumesCreated={subscription?.resumeCreatedCount ?? 0}
            coverLettersCreated={subscription?.coverLetterCreatedCount ?? 0}
            benefits={getPlanBenefits(subscriptionPlan)}
          />
        </section>
      </div>

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
