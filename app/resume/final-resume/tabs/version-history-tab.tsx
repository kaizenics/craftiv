"use client";

import { Button } from "@/components/ui/button";
import type { DesignOptions } from "@/components/resume/resume-preview";
import type { ResumeData } from "@/lib/types/resume";

type ResumeSnapshot = {
  id: string;
  createdAt: string;
  resumeName: string;
  resumeData: ResumeData;
  designOptions: DesignOptions;
  selectedColor: string;
};

type VersionHistoryTabProps = {
  snapshots: ResumeSnapshot[];
  snapshotSavedAt: string | null;
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (snapshot: ResumeSnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
};

export function VersionHistoryTab({
  snapshots,
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
        <Button size="sm" onClick={onSaveSnapshot}>
          Save Snapshot
        </Button>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Save manual restore points before major edits.
      </p>
      <div className="border-b pb-4" />

      {snapshotSavedAt && (
        <p className="text-xs text-green-600">
          Snapshot saved at {new Date(snapshotSavedAt).toLocaleString()}
        </p>
      )}

      {snapshots.length === 0 ? (
        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          No snapshots yet. Save one now to create your first restore point.
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="rounded-lg border bg-card p-3">
              <p className="text-sm font-medium">{snapshot.resumeName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(snapshot.createdAt).toLocaleString()}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onRestoreSnapshot(snapshot)}>
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteSnapshot(snapshot.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

