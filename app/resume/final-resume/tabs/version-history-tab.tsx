"use client";

import { Button } from "@/components/ui/button";
import type { ResumeSnapshotKind } from "@/db/schema";

export type ResumeSnapshotSummary = {
  id: string;
  name: string;
  kind: ResumeSnapshotKind;
  createdAt: Date;
};

const KIND_LABELS: Record<ResumeSnapshotKind, string> = {
  manual: "Saved by you",
  before_restore: "Before restore",
  before_ai: "Before AI rewrite",
};

type VersionHistoryTabProps = {
  snapshots: ResumeSnapshotSummary[];
  isLoading: boolean;
  isSaving: boolean;
  busySnapshotId: string | null;
  snapshotSavedAt: Date | null;
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
};

export function VersionHistoryTab({
  snapshots,
  isLoading,
  isSaving,
  busySnapshotId,
  snapshotSavedAt,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
}: VersionHistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          Version History
        </h2>
        <Button size="sm" onClick={onSaveSnapshot} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Snapshot"}
        </Button>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Restore points are saved to your account, so they follow you to any device.
        Craftiv also saves one automatically before a restore or an AI rewrite.
      </p>
      <div className="border-b pb-4" />

      {snapshotSavedAt && (
        <p className="text-xs text-green-600">
          Snapshot saved at {snapshotSavedAt.toLocaleString()}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading versions...</p>
      ) : snapshots.length === 0 ? (
        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          No snapshots yet. Save one now to create your first restore point.
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snapshot) => {
            const isBusy = busySnapshotId === snapshot.id;
            return (
              <div key={snapshot.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{snapshot.name}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {KIND_LABELS[snapshot.kind]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(snapshot.createdAt).toLocaleString()}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onRestoreSnapshot(snapshot.id)}
                    disabled={busySnapshotId !== null}
                  >
                    {isBusy ? "Working..." : "Restore"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteSnapshot(snapshot.id)}
                    disabled={busySnapshotId !== null}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
