"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE } from "@/lib/constants/auth";

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
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

const otpSchema = z.object({
  otp: z.string().length(6, "Please enter the 6-digit OTP code"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type SignUpStep = "details" | "otp";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignUpStep>("details");
  const [pendingSignUp, setPendingSignUp] = useState<SignUpFormValues | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSigningIn, setIsOtpSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryState = useMemo(() => {
    if (typeof window === "undefined") {
      return { redirectTo: "/", fromResumeUpload: false };
    }

    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
    const intent = params.get("intent");

    return {
      redirectTo: redirectParam?.startsWith("/") ? redirectParam : "/",
      fromResumeUpload: intent === "resume-upload",
    };
  }, []);

  const redirectTo = queryState.redirectTo;
  const fromResumeUpload = queryState.fromResumeUpload;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const sendOtp = async (email: string) => {
    const { error: sendOtpError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      // "email-verification" rather than "sign-in": this is the code that marks
      // the new account verified below, and verifyEmail only accepts an OTP
      // issued under that type.
      type: "email-verification",
    });

    if (sendOtpError) {
      const authError = sendOtpError.message || "Failed to send OTP. Please try again.";
      setError(authError);
      toast.error(authError);
      return false;
    }

    setOtpInfo("We sent a one-time code to your email.");
    toast.success("OTP sent. Check your inbox.");
    return true;
  };

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setError(null);
    setOtpInfo(null);

    try {
      const didSend = await sendOtp(data.email);
      if (!didSend) return;

      setPendingSignUp(data);
      setOtpCode("");
      setStep("otp");
    } catch (err) {
      const authError =
        err instanceof Error ? err.message : "Failed to start OTP verification.";
      setError(authError);
      toast.error(authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingSignUp) return;

    setIsOtpSending(true);
    setError(null);

    try {
      await sendOtp(pendingSignUp.email);
    } catch (err) {
      const authError =
        err instanceof Error ? err.message : "Failed to resend OTP. Please try again.";
      setError(authError);
      toast.error(authError);
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyAndCreateAccount = async () => {
    if (!pendingSignUp) return;

    setError(null);
    const parsed = otpSchema.safeParse({ otp: otpCode });
    if (!parsed.success) {
      const authError = parsed.error.issues[0]?.message || "Please enter a valid OTP code.";
      setError(authError);
      toast.error(authError);
      return;
    }

    setIsOtpSigningIn(true);

    try {
      // Checked before the account is created so a wrong code does not leave a
      // half-finished user behind. This read does not consume the code.
      const { error: verifyOtpError } = await authClient.emailOtp.checkVerificationOtp({
        email: pendingSignUp.email,
        otp: parsed.data.otp,
        type: "email-verification",
      });

      if (verifyOtpError) {
        const authError = verifyOtpError.message || "Invalid OTP. Please try again.";
        setError(authError);
        toast.error(authError);
        return;
      }

      let didSucceed = false;
      const { error: signUpError } = await authClient.signUp.email(
        {
          email: pendingSignUp.email,
          password: pendingSignUp.password,
          name: `${pendingSignUp.firstName} ${pendingSignUp.lastName}`,
          callbackURL: redirectTo,
        },
        {
          onSuccess: () => {
            didSucceed = true;
          },
          onError: (ctx) => {
            const authError =
              ctx.error.message || "Failed to create account. Please try again.";
            setError(authError);
            toast.error(authError);
          },
        },
      );

      /**
       * Sign-in requires a verified address, and signUp always creates the user
       * unverified — so without this the account exists but cannot be used, and
       * signUp skips its auto sign-in for the same reason. Spending the code
       * here marks the account verified and, via autoSignInAfterVerification,
       * establishes the session signUp declined to create.
       */
      if (didSucceed) {
        const { error: markVerifiedError } = await authClient.emailOtp.verifyEmail({
          email: pendingSignUp.email,
          otp: parsed.data.otp,
        });

        if (markVerifiedError) {
          const authError =
            markVerifiedError.message ||
            "Your account was created but we could not verify your email. Please sign in to receive a new link.";
          setError(authError);
          toast.error(authError);
          return;
        }

        toast.success("Account created successfully.");
        router.push(redirectTo);
        router.refresh();
      }

      if (signUpError && !didSucceed) {
        const authError = signUpError.message || "Failed to create account. Please try again.";
        setError(authError);
        toast.error(authError);
      }
    } catch (err) {
      const authError =
        err instanceof Error ? err.message : "Failed to complete sign up.";
      setError(authError);
      toast.error(authError);
    } finally {
      setIsOtpSigningIn(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
  };

  const isAuthBusy = isLoading || isOtpSending || isOtpSigningIn;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="p-8">
          {step === "otp" && (
            <div className="mb-2">
              <Button
                type="button"
                variant="ghost"
                className="h-auto p-0 text-zinc-700 hover:bg-transparent hover:text-zinc-900"
                onClick={() => setStep("details")}
                disabled={isAuthBusy}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </div>
          )}

          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-zinc-900">
              {step === "details" ? "Create an account" : "Verify your email"}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              {step === "details"
                ? "Get started with Craftiv today"
                : "Enter the one-time code we sent to your email"}
            </p>
            {step === "details" && fromResumeUpload && (
              <p className="mt-2 text-xs text-zinc-500">
                Create your account to continue scanning your resume.
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === "details" ? (
            <>
              <div className="mt-8 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                  disabled={isAuthBusy}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-zinc-500">Or continue with email</span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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

                  <Button type="submit" className="w-full" size="lg" disabled={isAuthBusy}>
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Sending OTP...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <div className="mt-8 space-y-4">
              {otpInfo && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm text-emerald-700">{otpInfo}</p>
                </div>
              )}

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">
                  OTP sent to{" "}
                  <span className="font-medium text-zinc-800">{pendingSignUp?.email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">One-time code</label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={isAuthBusy}
                  >
                    <InputOTPGroup className="justify-center">
                      <InputOTPSlot index={0} className="size-11 text-base" />
                      <InputOTPSlot index={1} className="size-11 text-base" />
                      <InputOTPSlot index={2} className="size-11 text-base" />
                      <InputOTPSlot index={3} className="size-11 text-base" />
                      <InputOTPSlot index={4} className="size-11 text-base" />
                      <InputOTPSlot index={5} className="size-11 text-base" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyAndCreateAccount}
                  disabled={isAuthBusy}
                >
                  {isOtpSigningIn ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Verifying...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendOtp}
                  disabled={isAuthBusy || !pendingSignUp}
                >
                  {isOtpSending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Resending...
                    </>
                  ) : (
                    "Resend OTP"
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
              className="font-medium text-zinc-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
