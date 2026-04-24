"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: changePasswordError } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (changePasswordError) {
        setError(changePasswordError.message || "Failed to change password. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      form.reset();
      
      // Redirect to settings after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/settings");
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 max-w-2xl">
      <div className="mb-6">
        <Link 
          href="/dashboard/settings" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          Back to Settings
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-foreground">Change Password</h1>
      <p className="text-muted-foreground mt-1 mb-8">
        Update your password to keep your account secure
      </p>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <svg 
              className="w-5 h-5 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <p className="text-sm text-green-600 font-medium">
              Password changed successfully! Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <svg 
              className="w-5 h-5 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your current password"
                      disabled={isLoading || success}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-border my-6" />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your new password"
                      disabled={isLoading || success}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters with uppercase, lowercase, and number
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your new password"
                      disabled={isLoading || success}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || success}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Changing password...
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/settings")}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-2">Password Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use a unique password that you don't use elsewhere</li>
          <li>• Include a mix of letters, numbers, and symbols</li>
          <li>• Avoid common words or personal information</li>
          <li>• Consider using a password manager</li>
        </ul>
      </div>
    </div>
  );
}
