"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OtpCodeInput, OTP_LENGTH } from "@/components/auth/otp-code-input";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import type { AuthMethodResponse } from "@/app/api/auth-method/route";
import { MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE } from "@/lib/constants/auth";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Mirrors the sign-up rules; the server rejects anything under
// MIN_PASSWORD_LENGTH, so a looser client rule would only turn a field error
// into a failed request.
const resetSchema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

type Step = "request" | "google" | "reset" | "password";

/** Better Auth allows 3 reset requests per 60s; keep the button in step with it. */
const RESEND_COOLDOWN_SECONDS = 60;

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const isBusy = isChecking || isSending || isResetting || isCheckingCode;

  async function requestCode(target: string, { isResend }: { isResend: boolean }) {
    setError(null);
    setIsSending(true);

    try {
      const { error: requestError } = await authClient.emailOtp.requestPasswordReset({
        email: target,
      });

      if (requestError) {
        const message =
          requestError.message || "Could not send the code. Please try again.";
        setError(message);
        toast.error(message);
        return false;
      }

      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(isResend ? "New code sent." : "Code sent. Check your inbox.");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not send the code. Please try again.";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsSending(false);
    }
  }

  async function startReset(target: string) {
    const sent = await requestCode(target, { isResend: false });
    if (!sent) return;
    setOtpCode("");
    setOtpError(null);
    setStep("reset");
  }

  const onRequestSubmit = async (data: EmailFormValues) => {
    const normalized = data.email.trim().toLowerCase();
    setError(null);
    setIsChecking(true);

    try {
      const response = await fetch("/api/auth-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      if (!response.ok) {
        const message =
          response.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : "Could not check that address. Please try again.";
        setError(message);
        toast.error(message);
        return;
      }

      const { method } = (await response.json()) as AuthMethodResponse;
      setEmail(normalized);

      if (method === "none") {
        emailForm.setError("email", {
          message: "No Craftiv account uses this email address.",
        });
        return;
      }

      if (method === "google") {
        setStep("google");
        return;
      }

      await startReset(normalized);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not check that address. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Gate the password fields behind a confirmed code. The check does not spend
   * the code (resetPassword does), and Better Auth counts failed checks toward
   * the same attempt limit, so this adds no extra guesses.
   */
  const checkCode = async (code = otpCode) => {
    if (code.length !== OTP_LENGTH) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }

    setOtpError(null);
    setError(null);
    setIsCheckingCode(true);

    try {
      const { error: checkError } = await authClient.emailOtp.checkVerificationOtp({
        email,
        otp: code,
        type: "forget-password",
      });

      if (checkError) {
        setOtpError(checkError.message || "That code didn't work. Please try again.");
        setOtpCode("");
        return;
      }

      setStep("password");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Could not check the code. Please try again.");
    } finally {
      setIsCheckingCode(false);
    }
  };

  const onResetSubmit = async (data: ResetFormValues) => {
    setOtpError(null);
    setError(null);
    setIsResetting(true);

    try {
      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email,
        otp: otpCode,
        password: data.password,
      });

      if (resetError) {
        const message =
          resetError.message || "Could not reset your password. Please try again.";
        // The code can expire while the password is being typed; send the user
        // back to enter a fresh one rather than leave them on a dead form.
        setStep("reset");
        setOtpCode("");
        setOtpError(message);
        toast.error(message);
        return;
      }

      toast.success("Password updated. Sign in with your new password.");
      router.push("/sign-in");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not reset your password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };

  const heading =
    step === "request"
      ? "Forgot your password?"
      : step === "google"
        ? "You sign in with Google"
        : step === "reset"
          ? "Check your email"
          : "Choose a new password";

  const subheading =
    step === "request" ? (
      "Enter your email and we'll help you get back in."
    ) : step === "google" ? (
      <>
        <span className="font-medium text-zinc-900">{email}</span> doesn&apos;t have a
        password. Continue with Google to get back in.
      </>
    ) : step === "reset" ? (
      <>
        Enter the 6-digit code we sent to
        <br />
        <span className="font-medium text-zinc-900">{email}</span>
      </>
    ) : (
      <>
        Code confirmed. Pick a new password for
        <br />
        <span className="font-medium text-zinc-900">{email}</span>
      </>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="p-8">
          {step !== "request" && (
            <div className="mb-2">
              <Button
                type="button"
                variant="ghost"
                className="h-auto p-0 text-zinc-700 hover:bg-transparent hover:text-zinc-900"
                onClick={() => {
                  setStep(step === "password" ? "reset" : "request");
                  setError(null);
                  setOtpError(null);
                }}
                disabled={isBusy}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </div>
          )}

          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-zinc-900">{heading}</h1>
            <p className="mt-2 text-sm text-zinc-600">{subheading}</p>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === "request" && (
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onRequestSubmit)}
                className="mt-8 space-y-4"
              >
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isBusy}>
                  {isChecking || isSending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Checking...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === "google" && (
            <div className="mt-8 space-y-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isBusy}
                onClick={() =>
                  authClient.signIn.social({ provider: "google", callbackURL: "/" })
                }
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
                <span className="h-px flex-1 bg-zinc-200" />
                or
                <span className="h-px flex-1 bg-zinc-200" />
              </div>

              {/* Settings hides "Change password" for Google accounts, so this flow is
                  the only way one can gain a password. Offering it here keeps that
                  door open instead of closing it behind the Google branch. */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 font-medium text-zinc-900 hover:bg-transparent hover:underline"
                  disabled={isBusy}
                  onClick={() => startReset(email)}
                >
                  {isSending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Sending code...
                    </>
                  ) : (
                    "Set a password instead"
                  )}
                </Button>
                <p className="mt-1.5 text-xs text-zinc-500">
                  We&apos;ll email you a code. Google sign-in keeps working.
                </p>
              </div>
            </div>
          )}

          {step === "reset" && (
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <OtpCodeInput
                  value={otpCode}
                  onChange={(value) => {
                    setOtpCode(value);
                    if (otpError) setOtpError(null);
                  }}
                  onComplete={(code) => void checkCode(code)}
                  disabled={isBusy}
                  invalid={!!otpError}
                />
                {otpError && (
                  <p className="text-center text-sm text-red-600" role="alert">
                    {otpError}
                  </p>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => checkCode()}
                disabled={isBusy || otpCode.length < OTP_LENGTH}
              >
                {isCheckingCode ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <p className="text-center text-sm text-zinc-600">
                Didn&apos;t get it?{" "}
                {cooldown > 0 ? (
                  <span className="text-zinc-400 tabular-nums">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestCode(email, { isResend: true })}
                    disabled={isBusy}
                    className="font-medium text-zinc-900 hover:underline disabled:opacity-50"
                  >
                    {isSending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </p>
            </div>
          )}

          {step === "password" && (
            <div className="mt-8">
              <Form {...resetForm}>
                <form
                  onSubmit={resetForm.handleSubmit(onResetSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Create a new password"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                              onClick={() => setShowPassword((value) => !value)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <PasswordChecklist password={field.value} showErrors={!!fieldState.error} />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Re-enter your new password"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              aria-label={
                                showConfirmPassword ? "Hide password" : "Show password"
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                              onClick={() => setShowConfirmPassword((value) => !value)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="!mt-6 w-full" size="lg" disabled={isBusy}>
                    {isResetting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Resetting...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-zinc-600">
            {step === "request" ? "Remembered it? " : ""}
            <Link href="/sign-in" className="font-medium text-zinc-900 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
