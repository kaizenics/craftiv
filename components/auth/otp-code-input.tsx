import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const OTP_LENGTH = 6;

/** The 6-box code entry shared by the sign-up and password-reset screens. */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Fires once all six digits are in, whether typed or pasted. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="flex justify-center">
      <InputOTP
        maxLength={OTP_LENGTH}
        value={value}
        onChange={(next) => {
          onChange(next);
          if (next.length === OTP_LENGTH) onComplete?.(next);
        }}
        disabled={disabled}
        autoFocus
        aria-label="6-digit verification code"
        aria-invalid={invalid || undefined}
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              aria-invalid={invalid || undefined}
              className="size-12 rounded-lg border bg-white text-lg font-medium first:rounded-lg last:rounded-lg"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
