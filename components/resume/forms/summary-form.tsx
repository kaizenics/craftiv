'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Lightbulb } from '@/components/ui/icons';

interface SummaryFormProps {
  data: string;
  onChange: (data: string) => void;
}

export function SummaryForm({ data, onChange }: SummaryFormProps) {
  const characterCount = data.length;
  const maxCharacters = 500;
  const isNearLimit = characterCount > maxCharacters * 0.8;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Professional Summary</h2>
        <p className="text-muted-foreground">
          Write a short introduction that highlights your experience, key skills, and career goals.
          This is often the first thing recruiters read.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          className="min-h-50 resize-y"
          placeholder="e.g. Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about creating elegant solutions to complex problems. Seeking to leverage my expertise in React and Node.js to contribute to innovative projects..."
          value={data}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxCharacters + 50}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Keep it concise—2-4 sentences work best.
          </p>
          <p
            className={`text-xs ${
              isOverLimit
                ? 'text-destructive'
                : isNearLimit
                ? 'text-yellow-600'
                : 'text-muted-foreground'
            }`}
          >
            {characterCount}/{maxCharacters} characters
          </p>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Tips for a great summary:
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <Check className="text-green-600 h-4 w-4" />
            <span>Start with a strong adjective describing your professional persona</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="text-green-600 h-4 w-4" />
            <span>Include years of experience and key areas of expertise</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="text-green-600 h-4 w-4" />
            <span>Mention 2-3 of your top skills or achievements</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="text-green-600 h-4 w-4" />
            <span>End with what you're looking to achieve or contribute</span>
          </li>
        </ul>
      </div>

      {/* Example Templates */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Example templates:</h3>
        <div className="grid gap-2">
          {[
            'Dedicated [job title] with [X] years of experience in [industry/field]. Proven track record in [key achievement]. Skilled in [top skills]. Looking to contribute to [type of company/role].',
            'Results-driven [job title] specializing in [area of expertise]. Demonstrated success in [key accomplishment with metrics]. Passionate about [industry interest] and committed to [professional goal].',
          ].map((template, index) => (
            <button
              key={index}
              onClick={() => onChange(template)}
              className="text-left text-sm p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground">{template}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
