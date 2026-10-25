"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import { Eye, EyeOff, Globe, Link2, RefreshCw, Send } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { CountUp } from "@/components/ui/count-up";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

// Models the real share behaviour (trpc/routers/share.ts): links are /r/<random token>, can be
// switched off, can be regenerated (the old token dies), and count views. Example data only.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const newToken = () => Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
const HOST = "gocraftiv.com";

type Event = { id: number; kind: "sent" | "opened" | "off" | "on" | "new"; text: string };
const EVENT_ICON = { sent: Send, opened: Eye, off: EyeOff, on: Link2, new: RefreshCw };

export function ShareShowcase() {
  const reduce = useReducedMotion();
  const linkRef = useRef<HTMLDivElement>(null);
  const inView = useInView(linkRef, { once: true, margin: "0px 0px -20% 0px" });
  const visible = useInView(linkRef, { margin: "0px 0px -20% 0px" });
  // The demo plays itself while on screen, until the visitor takes over by pressing anything.
  const [auto, setAuto] = useState(true);
  const autoplay = auto && visible && !reduce;

  const [isPublic, setIsPublic] = useState(true);
  const [token, setToken] = useState("k3f9xq2m");
  const [typed, setTyped] = useState(0);
  const [sentToken, setSentToken] = useState<string | null>(null);
  const [views, setViews] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const nextId = useRef(0);
  // The latest link state, read by the delayed "opened" event so it never fires on a dead or private link.
  const live = useRef({ token, isPublic });
  useEffect(() => {
    live.current = { token, isPublic };
  }, [token, isPublic]);

  // The token types itself out once the link scrolls into view, and again after "New link".
  useEffect(() => {
    if (!inView || reduce || typed >= token.length) return;
    const timer = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 350 : 70);
    return () => clearTimeout(timer);
  }, [inView, reduce, typed, token]);
  const shown = reduce ? token.length : typed;
  const typing = shown < token.length;

  const log = useCallback(
    (kind: Event["kind"], text: string) => setEvents((prev) => [{ id: nextId.current++, kind, text }, ...prev].slice(0, 3)),
    [],
  );

  const send = useCallback(() => {
    const sent = token;
    setSentToken(sent);
    log("sent", "Sent to a recruiter");
    setTimeout(() => {
      if (live.current.token !== sent || !live.current.isPublic) return;
      setViews((n) => n + 1);
      log("opened", "Opened in Manila, just now");
    }, 1100);
  }, [token, log]);
  const toggle = (on: boolean) => {
    setIsPublic(on);
    log(on ? "on" : "off", on ? "Link switched back on" : "Link switched off. It opens nothing now");
  };
  const regenerate = useCallback(() => {
    setToken(newToken());
    setTyped(0);
    setViews(0);
    log("new", "New link made. The old one is retired");
  }, [log]);

  // Autoplay: once the link is typed, send it; once it has been opened, make a new link and go again.
  useEffect(() => {
    if (!autoplay || typing || !isPublic || sentToken === token) return;
    const timer = setTimeout(send, 900);
    return () => clearTimeout(timer);
  }, [autoplay, typing, isPublic, sentToken, token, send]);
  useEffect(() => {
    if (!autoplay || sentToken !== token || views === 0) return;
    const timer = setTimeout(regenerate, 4500);
    return () => clearTimeout(timer);
  }, [autoplay, sentToken, token, views, regenerate]);

  const screen = !sentToken ? "waiting" : sentToken !== token ? "dead" : isPublic ? "resume" : "off";

  return (
    <MotionConfig reducedMotion="user">
      <section id="share" className="scroll-mt-24 bg-zinc-50 py-24 font-sans lg:py-32">
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

          <BlurFade className="mt-14 rounded-[2rem] bg-white p-6 sm:p-10 lg:p-14">
            {/* The link itself is the hero. */}
            <div ref={linkRef}>
              <p className="text-sm font-medium text-zinc-500">Your resume link</p>
            </div>

            <div
              className={cn(
                "mt-5 flex min-w-0 items-center gap-3 font-display text-[clamp(1.1rem,5.8vw,4.75rem)] leading-none tracking-tight transition-colors duration-500 sm:gap-5",
                isPublic ? "text-zinc-900" : "text-zinc-300",
              )}
              aria-label={`${HOST}/r/${token}${isPublic ? "" : ", switched off"}`}
            >
              <Globe className={cn("size-[0.8em] shrink-0 transition-colors", isPublic ? "text-primary" : "text-zinc-300")} aria-hidden />
              <p className={cn("min-w-0 py-2 break-all sm:break-normal", !isPublic && "line-through decoration-2")} aria-hidden>
                {HOST}
                <span className={isPublic ? "text-zinc-400" : undefined}>/r/</span>
                <span className={isPublic ? "text-primary" : undefined}>{token.slice(0, shown)}</span>
                {isPublic ? (
                  <span
                    className={cn("ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] bg-primary", !typing && "animate-[caret_1s_steps(1)_infinite]")}
                    aria-hidden
                  />
                ) : null}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAuto(false);
                  send();
                }}
                disabled={!isPublic || typing}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden />
                {sentToken === token ? "Send again" : "Send to recruiter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuto(false);
                  regenerate();
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
              >
                <RefreshCw className="size-4" aria-hidden />
                New link
              </button>
              <label className="ml-auto inline-flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-100 px-4 py-2.5">
                <span className="text-sm font-medium text-zinc-700">Public link</span>
                <Switch
                  checked={isPublic}
                  onCheckedChange={(on) => {
                    setAuto(false);
                    toggle(on);
                  }}
                  aria-label="Public link"
                />
              </label>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              {/* What you see: views and the activity on the link. */}
              <div className="flex h-[24rem] min-w-0 flex-col overflow-hidden rounded-3xl bg-zinc-50 p-6 sm:h-[26rem]">
                <div className="flex items-baseline gap-3" aria-live="polite">
                  <p className="font-display text-6xl font-semibold tabular-nums text-zinc-900">
                    <CountUp to={views} duration={0.8} />
                  </p>
                  <p className="text-sm text-zinc-500">{views === 1 ? "view on this link" : "views on this link"}</p>
                </div>
                <ul className="mt-6 grid gap-2 overflow-hidden" aria-label="Link activity">
                  {/* popLayout takes a leaving item out of the flow at once, so the others glide instead of jumping. */}
                  <AnimatePresence initial={false} mode="popLayout">
                    {events.length ? (
                      events.map((event) => {
                        const Icon = EVENT_ICON[event.kind];
                        return (
                          <motion.li
                            key={event.id}
                            layout
                            initial={{ opacity: 0, y: -14, scale: 0.97, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
                            transition={{
                              layout: { type: "spring", stiffness: 260, damping: 30, mass: 0.8 },
                              default: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                            }}
                            className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm text-zinc-700"
                          >
                            <span
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-lg",
                                event.kind === "opened" ? "bg-primary text-primary-foreground" : "bg-zinc-100 text-zinc-500",
                              )}
                            >
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            {event.text}
                          </motion.li>
                        );
                      })
                    ) : (
                      <li className="rounded-xl px-3 py-2.5 text-sm text-zinc-400">Activity on your link shows up here.</li>
                    )}
                  </AnimatePresence>
                </ul>
              </div>

              {/* What the recruiter sees. */}
              <div className="flex h-[24rem] min-w-0 flex-col overflow-hidden rounded-3xl bg-zinc-100 sm:h-[26rem]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="size-2.5 rounded-full bg-zinc-300" />
                    <span className="size-2.5 rounded-full bg-zinc-300" />
                    <span className="size-2.5 rounded-full bg-zinc-300" />
                  </span>
                  <span className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-1.5 text-xs text-zinc-500">
                    {sentToken ? `${HOST}/r/${sentToken}` : "The recruiter's browser"}
                  </span>
                </div>
                <div className="relative min-h-0 flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    {screen === "resume" ? (
                      <motion.div
                        key="resume"
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                        className="absolute inset-0 overflow-hidden px-6 pt-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/resume-templates/harvard.webp"
                          alt="The shared resume as the recruiter sees it"
                          className="mx-auto w-full max-w-sm rounded-t-xl shadow-[0_20px_40px_-20px_rgb(24_24_27/0.35)]"
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
                          <Send className="size-7 text-zinc-300" aria-hidden />
                        ) : (
                          <EyeOff className="size-7 text-zinc-300" aria-hidden />
                        )}
                        <p className="mt-4 font-display text-xl font-semibold text-zinc-900">
                          {screen === "waiting" ? "Nothing here yet" : screen === "off" ? "This link is off" : "This link no longer works"}
                        </p>
                        <p className="mt-1 max-w-xs text-sm text-zinc-500">
                          {screen === "waiting"
                            ? "Press Send to recruiter and watch it arrive."
                            : screen === "off"
                              ? "The owner made this resume private."
                              : "The owner made a new link, so this one is retired."}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </BlurFade>

          <p className="mt-4 text-xs text-zinc-400">Example. Your own visits never count toward the views.</p>
        </div>
      </section>
    </MotionConfig>
  );
}
