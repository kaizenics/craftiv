"use client";

import { CoverLetterContact } from "@/lib/types/cover-letter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactFormProps {
  data: CoverLetterContact;
  onChange: (data: CoverLetterContact) => void;
}

export function ContactForm({ data, onChange }: ContactFormProps) {
  const handleChange = (field: keyof CoverLetterContact, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Your Contact Information</h2>
        <p className="text-sm text-muted-foreground">This appears at the top of your cover letter.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City, State, ZIP</Label>
        <Input
          id="city"
          value={data.city}
          onChange={(e) => handleChange("city", e.target.value)}
          placeholder="San Francisco, CA 94102"
        />
      </div>
    </div>
  );
}
