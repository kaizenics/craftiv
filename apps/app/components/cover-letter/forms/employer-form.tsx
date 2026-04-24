"use client";

import { CoverLetterEmployer } from "@/lib/types/cover-letter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmployerFormProps {
  data: CoverLetterEmployer;
  onChange: (data: CoverLetterEmployer) => void;
}

export function EmployerForm({ data, onChange }: EmployerFormProps) {
  const handleChange = (field: keyof CoverLetterEmployer, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Employer Details</h2>
        <p className="text-sm text-muted-foreground">Who are you addressing this letter to?</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hiringManagerName">Hiring Manager Name</Label>
        <Input
          id="hiringManagerName"
          value={data.hiringManagerName}
          onChange={(e) => handleChange("hiringManagerName", e.target.value)}
          placeholder="Jane Smith"
        />
        <p className="text-xs text-muted-foreground">
          Optional: include this if you want it shown in the recipient block.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title You&apos;re Applying For</Label>
        <Input
          id="jobTitle"
          value={data.jobTitle}
          onChange={(e) => handleChange("jobTitle", e.target.value)}
          placeholder="Senior Software Engineer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={data.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          placeholder="Acme Inc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyAddress">Company Address</Label>
        <Input
          id="companyAddress"
          value={data.companyAddress}
          onChange={(e) => handleChange("companyAddress", e.target.value)}
          placeholder="456 Corporate Blvd, New York, NY 10001"
        />
      </div>
    </div>
  );
}
