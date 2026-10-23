"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, Copy, Loader2, Mail, Plus, Trash2, X } from "@/components/ui/icons";
import { TRACKER_LIMITS, TRACKER_STATUS_LABELS, TRACKER_STATUSES, type CustomField, type TrackerStatus } from "@/lib/types/applications";
import { trpc } from "@/trpc/client";

export type ApplicationDraft = {
  id?: string;
  status: TrackerStatus;
  company: string;
  title: string;
  postingUrl: string;
  contact: string;
  appliedOn: string;
  interviewStage: string;
  interviewer: string;
  notes: string;
  salary: string;
  location: string;
  followUpEmail?: string;
  customFields: CustomField[];
};

export const emptyDraft = (status: TrackerStatus = "saved"): ApplicationDraft => ({
  status,
  company: "",
  title: "",
  postingUrl: "",
  contact: "",
  appliedOn: "",
  interviewStage: "",
  interviewer: "",
  notes: "",
  salary: "",
  location: "",
  customFields: [],
});

type ApplicationSheetProps = {
  /** The card being edited (with id) or a new one; null keeps the sheet closed. */
  draft: ApplicationDraft | null;
  /** The open tab: new cards go here, and with more than one tab a card can be moved to another. */
  boardId: string;
  boards: { id: string; name: string }[];
  onClose: () => void;
};

/** Create or edit one tracked application. Parent remounts it per card via `key`. */
export function ApplicationSheet({ draft, boardId, boards, onClose }: ApplicationSheetProps) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<ApplicationDraft>(draft ?? emptyDraft());
  const [targetBoard, setTargetBoard] = useState(boardId);
  const isNew = !form.id;
  const done = async (message: string) => {
    await utils.applications.list.invalidate();
    toast.success(message);
    onClose();
  };
  const create = trpc.applications.create.useMutation({
    onSuccess: () => done("Application added."),
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.applications.update.useMutation({ onSuccess: () => done("Saved."), onError: (e) => toast.error(e.message) });
  const remove = trpc.applications.remove.useMutation({
    onSuccess: () => done("Application deleted."),
    onError: (e) => toast.error(e.message),
  });
  const move = trpc.applications.move.useMutation();
  const followUp = trpc.applications.followUpEmail.useMutation({
    onSuccess: async (result) => {
      set("followUpEmail", result.followUpEmail);
      await utils.applications.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const pending = create.isPending || update.isPending || remove.isPending;

  const set = <K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setCustom = (index: number, patch: Partial<CustomField>) =>
    set(
      "customFields",
      form.customFields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );

  const save = async () => {
    if (!form.company.trim() && !form.title.trim()) {
      toast.error("Add at least a company or a job title.");
      return;
    }
    const { id, status, followUpEmail, ...rest } = form;
    void followUpEmail; // AI-written, saved by its own mutation, never sent back through update.
    // Unnamed custom fields are dropped rather than rejected.
    const payload = { ...rest, customFields: rest.customFields.filter((field) => field.label.trim()) };
    if (!id) {
      create.mutate({ ...payload, status, boardId: targetBoard });
      return;
    }
    if (draft && status !== draft.status) await move.mutateAsync({ id, status });
    update.mutate({ id, ...payload, ...(targetBoard !== boardId ? { boardId: targetBoard } : {}) });
  };

  const textField = (
    key: "company" | "title" | "contact" | "interviewStage" | "interviewer" | "salary" | "location",
    label: string,
    placeholder: string,
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`app-${key}`}>{label}</Label>
      <Input
        id={`app-${key}`}
        value={form[key]}
        maxLength={TRACKER_LIMITS.text}
        placeholder={placeholder}
        onChange={(event) => set(key, event.target.value)}
      />
    </div>
  );

  return (
    <Sheet open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isNew ? "New application" : form.title || form.company || "Application"}</SheetTitle>
          <SheetDescription>Everything about this application, in one place.</SheetDescription>
        </SheetHeader>

        <div className="grid gap-5 px-6 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {textField("company", "Company", "Acme Logistics")}
            {textField("title", "Job title", "Executive assistant")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="app-status">Status</Label>
              <Select value={form.status} onValueChange={(value) => set("status", value as TrackerStatus)}>
                <SelectTrigger id="app-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACKER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TRACKER_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="app-date">Application date</Label>
              <Input id="app-date" type="date" value={form.appliedOn} onChange={(event) => set("appliedOn", event.target.value)} />
            </div>
          </div>

          {boards.length > 1 ? (
            <div className="grid gap-1.5">
              <Label htmlFor="app-board">Board</Label>
              <Select value={targetBoard} onValueChange={setTargetBoard}>
                <SelectTrigger id="app-board">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="app-link">Job posting link</Label>
            <div className="flex gap-2">
              <Input
                id="app-link"
                type="url"
                value={form.postingUrl}
                maxLength={TRACKER_LIMITS.url}
                placeholder="https://"
                onChange={(event) => set("postingUrl", event.target.value)}
              />
              {/^https?:\/\//i.test(form.postingUrl) ? (
                <Button variant="outline" size="icon" asChild>
                  <a href={form.postingUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label="Open the job posting">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {textField("contact", "Contact", "Recruiter or referral")}
            {textField("interviewer", "Interviewer", "Who you met")}
          </div>
          {textField("interviewStage", "Interview stage", "First round, technical, final...")}
          <div className="grid gap-4 sm:grid-cols-2">
            {textField("salary", "Salary", "$60k to $70k")}
            {textField("location", "Location", "Remote, Manila...")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="app-notes">Notes</Label>
            <Textarea
              id="app-notes"
              value={form.notes}
              rows={4}
              maxLength={TRACKER_LIMITS.notes}
              placeholder="Salary range, culture, what to follow up on..."
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Your own fields</p>
              <Button
                variant="ghost"
                size="sm"
                disabled={form.customFields.length >= TRACKER_LIMITS.customFields}
                onClick={() => set("customFields", [...form.customFields, { label: "", value: "" }])}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add field
              </Button>
            </div>
            {form.customFields.length === 0 ? (
              <p className="text-xs text-muted-foreground">Track anything else, like referral source, benefits or visa.</p>
            ) : (
              form.customFields.map((field, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    aria-label={`Field ${index + 1} name`}
                    value={field.label}
                    maxLength={TRACKER_LIMITS.customLabel}
                    placeholder="Field name"
                    className="w-2/5"
                    onChange={(event) => setCustom(index, { label: event.target.value })}
                  />
                  <Input
                    aria-label={`Field ${index + 1} value`}
                    value={field.value}
                    maxLength={TRACKER_LIMITS.customValue}
                    placeholder="Value"
                    onChange={(event) => setCustom(index, { value: event.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove field ${index + 1}`}
                    onClick={() =>
                      set(
                        "customFields",
                        form.customFields.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {!isNew ? (
            <div className="grid gap-2 rounded-xl bg-muted/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Follow-up email</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card"
                  disabled={followUp.isPending}
                  onClick={() => form.id && followUp.mutate({ id: form.id })}
                >
                  {followUp.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Mail className="size-4" aria-hidden="true" />
                  )}
                  {form.followUpEmail ? "Write a new one" : "Write it for me"}
                </Button>
              </div>
              {form.followUpEmail ? (
                <>
                  <p className="whitespace-pre-wrap rounded-lg bg-card p-3 text-sm leading-relaxed text-foreground">{form.followUpEmail}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-self-start"
                    onClick={() =>
                      navigator.clipboard?.writeText(form.followUpEmail ?? "").then(
                        () => toast.success("Email copied."),
                        () => toast.error("Could not copy. Select the text instead."),
                      )
                    }
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    Copy email
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A short, polite nudge from the details above. Uses 0.25 credits, refunded if it fails.
                </p>
              )}
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={() => void save()} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {isNew ? "Add application" : "Save changes"}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            {!isNew ? (
              <Button
                variant="ghost"
                className="ml-auto text-muted-foreground hover:text-destructive-surface-foreground"
                disabled={pending}
                onClick={() => {
                  if (form.id && window.confirm("Delete this application? This cannot be undone.")) remove.mutate({ id: form.id });
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
