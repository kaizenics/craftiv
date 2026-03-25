"use client";

import { Label } from "@/components/ui/label";

interface LetterBodyFormProps {
  opening: string;
  body: string;
  closing: string;
  onOpeningChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onClosingChange: (value: string) => void;
}

export function LetterBodyForm({
  opening,
  body,
  closing,
  onOpeningChange,
  onBodyChange,
  onClosingChange,
}: LetterBodyFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Letter Content</h2>
        <p className="text-sm text-muted-foreground">Write the body of your cover letter in three parts.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opening">Opening Paragraph</Label>
        <textarea
          id="opening"
          value={opening}
          onChange={(e) => onOpeningChange(e.target.value)}
          placeholder="Introduce yourself and state the position you're applying for. Mention how you heard about it or why you're excited about the opportunity..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Hook the reader — mention the role and your enthusiasm.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Main Body</Label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Highlight your relevant experience, skills, and accomplishments. Explain why you're a great fit for the role and what value you'd bring to the company..."
          rows={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring resize-none"
        />
        <p className="text-xs text-muted-foreground">
          This is your chance to sell your qualifications. Use specific examples.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="closing">Closing Paragraph</Label>
        <textarea
          id="closing"
          value={closing}
          onChange={(e) => onClosingChange(e.target.value)}
          placeholder="Restate your interest, thank the reader for their time, and include a call to action (e.g., 'I look forward to discussing how I can contribute...')."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring resize-none"
        />
        <p className="text-xs text-muted-foreground">
          End strong — thank them and express eagerness for next steps.
        </p>
      </div>
    </div>
  );
}
