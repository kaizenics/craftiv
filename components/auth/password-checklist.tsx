import { Check, Circle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { MIN_PASSWORD_LENGTH } from "@/lib/constants/auth";
import { cn } from "@/lib/utils";

/** Mirrors the sign-up password schema, one line per rule. */
export const PASSWORD_RULES = [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (p: string) => p.length >= MIN_PASSWORD_LENGTH },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

/**
 * Live checklist of the password rules. Unmet rules turn red once `showErrors`
 * is set (after a failed submit), so the list doubles as the field's error.
 */
export function PasswordChecklist({ password, showErrors = false }: { password: string; showErrors?: boolean }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-300",
              met ? "text-emerald-600" : showErrors ? "text-red-600" : "text-zinc-500",
            )}
          >
            <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={met ? "met" : "unmet"}
                  initial={{ scale: 0.4, opacity: 0, rotate: met ? -45 : 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {met ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.span animate={{ x: met ? 2 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              {rule.label}
              <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
            </motion.span>
          </li>
        );
      })}
    </ul>
  );
}
