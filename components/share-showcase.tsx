"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { EyeOff, Link2, RefreshCw, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

// Models the real share behaviour (trpc/routers/share.ts): links are /r/<random token>, can be
// switched off, can be regenerated (the old token dies), and count views. Example data only.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const newToken = () => Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

// One S-curve from your panel (left, lower) to the recruiter's (right, higher), in the 112x160 box.
const PATH = "M0 110 C 56 110, 56 50, 112 50";
const PATH_START = "M0 110 C 28 110, 40 98, 50 86";
const PATH_END = "M62 74 C 72 62, 84 50, 112 50";

type RecruiterScreen = "waiting" | "resume" | "off" | "dead";

export function ShareShowcase() {
  const [isPublic, setIsPublic] = useState(true);
  const [token, setToken] = useState("k3f9xq2m");
  const [sentToken, setSentToken] = useState<string | null>(null);
  const [flying, setFlying] = useState(0);
  const [views, setViews] = useState(0);

  // What the recruiter sees follows from what was sent and the state of the link now.
  const screen: RecruiterScreen = !sentToken ? "waiting" : sentToken !== token ? "dead" : isPublic ? "resume" : "off";

  const line: "live" | "off" | "snapped" = !isPublic ? "off" : screen === "dead" ? "snapped" : "live";

  const send = () => {
    setSentToken(token);
    setFlying((n) => n + 1);
    // The recruiter opens it as the link lands.
    setTimeout(() => setViews((n) => n + 1), 900);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section id="share" className="scroll-mt-24 border-t border-zinc-200 bg-zinc-50 py-24 font-sans lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">
            <BlurInText text="Share a link. See it land." />
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            <BlurInText
              text="Send your resume as a link, know when it is opened, and switch it off whenever you like. Try both sides."
              delay={0.4}
              stagger={0.01}
            />
          </p>

          <BlurFade className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_7rem_minmax(0,7fr)] lg:gap-0">
            {/* You */}
            <div className="flex min-w-0 flex-col rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
              <p className="text-sm font-medium text-zinc-500">You</p>
              <p className="mt-1 font-display text-2xl font-semibold text-zinc-900">Executive assistant resume</p>

              <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-zinc-900">Public link</span>
                  <span className="block text-xs text-zinc-500">{isPublic ? "Anyone with the link can open it" : "Off. The link opens nothing"}</span>
                </span>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Public link" />
              </label>

              <div className={cn("mt-3 flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors", isPublic ? "border-zinc-200" : "border-dashed border-zinc-200")}>
                <Link2 className={cn("size-4 shrink-0", isPublic ? "text-primary" : "text-zinc-300")} aria-hidden />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={token}
                    initial={{ opacity: 0, filter: "blur(6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(6px)" }}
                    className={cn("min-w-0 truncate font-mono text-sm", isPublic ? "text-zinc-800" : "text-zinc-300 line-through")}
                  >
                    gocraftiv.com/r/{token}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={send}
                  disabled={!isPublic}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                >
                  <Send className="size-4" aria-hidden />
                  {sentToken === token ? "Send again" : "Send to recruiter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setToken(newToken());
                    setViews(0);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
                >
                  <RefreshCw className="size-4" aria-hidden />
                  New link
                </button>
              </div>

              <div className="mt-6 flex items-baseline gap-3 border-t border-zinc-100 pt-5 lg:mt-auto" aria-live="polite">
                <p className="font-display text-4xl font-semibold tabular-nums text-zinc-900">{views}</p>
                <p className="text-sm text-zinc-500">
                  {views === 0 ? "views so far" : views === 1 ? "view, opened just now" : "views, last opened just now"}
                </p>
              </div>
            </div>

            {/* The link itself, drawn between the two sides. Desktop only; phones stack the panels. */}
            <div className="relative hidden items-center justify-center lg:flex" aria-hidden>
              <div className="relative h-40 w-28">
                <svg viewBox="0 0 112 160" className="absolute inset-0 size-full overflow-visible">
                  {line === "off" ? (
                    <>
                      <path d={PATH_START} fill="none" strokeWidth="2" strokeDasharray="4 6" className="stroke-zinc-300" />
                      <path d={PATH_END} fill="none" strokeWidth="2" strokeDasharray="4 6" className="stroke-zinc-300" />
                      <path d="M50 74 l12 12 M62 74 l-12 12" strokeWidth="2" strokeLinecap="round" className="stroke-zinc-400" />
                    </>
                  ) : (
                    <motion.path
                      d={PATH}
                      fill="none"
                      strokeWidth="2"
                      strokeDasharray="4 6"
                      initial={false}
                      animate={line === "live" ? { strokeDashoffset: [0, -20] } : { strokeDashoffset: 0 }}
                      transition={line === "live" ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
                      className={cn("transition-[stroke] duration-500", line === "live" ? (sentToken ? "stroke-primary" : "stroke-primary/40") : "stroke-zinc-300")}
                    />
                  )}
                  <circle cx="0" cy="110" r="4" className={line === "live" ? "fill-primary" : "fill-zinc-300"} />
                  <circle cx="112" cy="50" r="4" className={line === "live" && sentToken ? "fill-primary" : "fill-zinc-300"} />
                </svg>
                {/* The chip rides the same path via CSS offset-path. */}
                <AnimatePresence>
                  {flying > 0 && line === "live" ? (
                    <motion.span
                      key={flying}
                      initial={{ offsetDistance: "0%", opacity: 0, scale: 0.85 }}
                      animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0], scale: [0.85, 1, 1, 0.85] }}
                      transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                      style={{ offsetPath: `path("${PATH}")`, offsetRotate: "0deg" }}
                      className="absolute top-0 left-0 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-primary-foreground shadow-lg"
                    >
                      <Link2 className="size-3" />
                      /r/{token}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {/* Recruiter */}
            <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white">
              <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3">
                <p className="text-sm font-medium text-zinc-500">Recruiter</p>
                <span className="min-w-0 flex-1 truncate rounded-lg bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-500">
                  {sentToken ? `gocraftiv.com/r/${sentToken}` : "Waiting for a link"}
                </span>
              </div>
              <div className="relative h-[22rem] sm:h-[26rem]">
                <AnimatePresence mode="wait" initial={false}>
                  {screen === "resume" ? (
                    <motion.div
                      key="resume"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                      className="absolute inset-0 overflow-hidden bg-zinc-100 px-6 pt-6"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/resume-templates/harvard.jpg"
                        alt="The shared resume as the recruiter sees it"
                        className="mx-auto w-full max-w-sm rounded-t-lg shadow-[0_20px_40px_-20px_rgb(24_24_27/0.35)]"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={screen}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
                    >
                      {screen === "waiting" ? (
                        <>
                          <Send className="size-8 text-zinc-300" strokeWidth={1.5} aria-hidden />
                          <p className="mt-4 font-display text-xl font-semibold text-zinc-900">Nothing here yet</p>
                          <p className="mt-1 max-w-xs text-sm text-zinc-500">Press Send to recruiter and watch it arrive.</p>
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-8 text-zinc-300" strokeWidth={1.5} aria-hidden />
                          <p className="mt-4 font-display text-xl font-semibold text-zinc-900">
                            {screen === "off" ? "This link is off" : "This link no longer works"}
                          </p>
                          <p className="mt-1 max-w-xs text-sm text-zinc-500">
                            {screen === "off"
                              ? "The owner made this resume private."
                              : "The owner made a new link, so this one is retired."}
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </BlurFade>

          <p className="mt-4 text-xs text-zinc-400">Example. Your own visits never count toward the views.</p>
        </div>
      </section>
    </MotionConfig>
  );
}
