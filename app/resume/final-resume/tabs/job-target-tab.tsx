"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JobTargetTabProps = {
  role: string;
  description: string;
  onRoleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUseInAssistant: () => void;
  onUseInAts: () => void;
};

export function JobTargetTab({
  role,
  description,
  onRoleChange,
  onDescriptionChange,
  onUseInAssistant,
  onUseInAts,
}: JobTargetTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">Job Target</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Set your target role and job description to guide optimization.
      </p>
      <div className="border-b pb-4" />

      <div className="space-y-2">
        <Label htmlFor="job-target-role">Target Role</Label>
        <Input
          id="job-target-role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-target-description">Job Description</Label>
        <textarea
          id="job-target-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={8}
          placeholder="Paste the target job description here..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={onUseInAssistant}>
          Use in AI Resume Assistant
        </Button>
        <Button className="w-full" variant="outline" onClick={onUseInAts}>
          Use in ATS Checker
        </Button>
      </div>
    </div>
  );
}

