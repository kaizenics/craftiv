"use client";

import { useEffect, useState } from "react";

import {
  SpotlightTour,
  findVisibleTarget,
  type TourStep,
} from "@/components/onboarding/spotlight-tour";
import { TOURS } from "@/components/onboarding/tours";
import type { OnboardingTourKey } from "@/lib/onboarding";
import { trpc } from "@/trpc/client";

/**
 * Runs one page's guided tour the first time that page is opened, then records
 * it against the account so it does not run again.
 *
 * Mounted per page rather than once at the layout: a tour should introduce the
 * area a person just walked into, and only that one.
 */
/**
 * Whether `tour` is still owed to this account.
 *
 * For pages that show sample data during their tour. It reads the same cached
 * query PageTour writes completion into, so a page's samples leave in the same
 * frame the tour closes. False while loading: samples must never flash up for
 * someone who has already seen the tour.
 */
export function useTourPending(tour: OnboardingTourKey): boolean {
  const { data } = trpc.user.onboardingStatus.useQuery();
  return data !== undefined && !data.completed.includes(tour);
}

export function PageTour({ tour }: { tour: OnboardingTourKey }) {
  const utils = trpc.useUtils();
  const { data } = trpc.user.onboardingStatus.useQuery();
  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      utils.user.onboardingStatus.invalidate();
    },
  });

  const [steps, setSteps] = useState<TourStep[] | null>(null);

  const shouldShow = Boolean(data) && !data?.completed.includes(tour);

  // Anchors mount with the page's own data, so targets are polled for a few
  // frames rather than read once. Steps whose target never appears are dropped
  // instead of spotlighting nothing -- several anchors are absent on small
  // screens, and empty states render a different tree entirely.
  useEffect(() => {
    if (!shouldShow) return;

    const definition = TOURS[tour];
    let frame = 0;
    let attempts = 0;

    const resolve = () => {
      // Visible, not merely present: several anchors have an off-screen twin
      // (the mobile sidebar drawer), and existence alone passed those through.
      const found = definition.filter((step) => findVisibleTarget(step.target));
      // Settles once every anchor is present, or after ~40 frames if at least
      // one is. With none found it keeps waiting (up to ~10s): a page can
      // render its whole tree only after a query resolves -- the Job Hunter
      // shows its sample layout to a brand-new account only once the pipeline
      // is known to be empty -- and settling early on zero steps meant that
      // tour never ran at all.
      const settled =
        found.length === definition.length ||
        (attempts > 40 && found.length > 0) ||
        attempts > 600;
      if (settled) {
        setSteps(found);
        return;
      }
      attempts += 1;
      frame = requestAnimationFrame(resolve);
    };

    frame = requestAnimationFrame(resolve);
    return () => cancelAnimationFrame(frame);
  }, [shouldShow, tour]);

  if (!shouldShow || !steps || steps.length === 0) return null;

  return (
    <SpotlightTour
      steps={steps}
      open
      onClose={() => {
        // Written to the shared query cache before the request, not held in
        // local state: the tour must close on the click rather than after the
        // round trip, and other readers of this status -- the Job Hunter's
        // sample jobs -- must see it change in the same frame. Only a successful
        // write triggers a refetch, so a failed one does not reopen the tour.
        utils.user.onboardingStatus.setData(undefined, (previous) => ({
          completed: [...new Set([...(previous?.completed ?? []), tour])],
        }));
        completeOnboarding.mutate({ tour });
      }}
    />
  );
}
