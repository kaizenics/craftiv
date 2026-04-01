"use client";

import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";

interface LetterBodyFormProps {
  content: string;
  onContentChange: (value: string) => void;
  onGenerateWithAI?: () => void;
  isGeneratingWithAI?: boolean;
  generateError?: string;
}

export function LetterBodyForm({
  content,
  onContentChange,
  onGenerateWithAI,
  isGeneratingWithAI,
  generateError,
}: LetterBodyFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Letter Content</h2>
        <p className="text-sm text-muted-foreground">
          Write your full cover letter in one rich editor.
        </p>
      </div>

      <div className="space-y-2">
        <WysiwygEditor
          value={content}
          onChange={onContentChange}
          placeholder="Write your complete cover letter here. You can include your greeting, key achievements, and closing paragraph."
          onGenerateWithAI={onGenerateWithAI}
          isGeneratingWithAI={isGeneratingWithAI}
        />
        {generateError && (
          <p className="text-xs text-red-600">{generateError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Use formatting tools to emphasize key achievements and details.
        </p>
      </div>
    </div>
  );
}
