'use client';

import {
  FinalizeOptions,
  Language,
  Certification,
  Award,
  Website,
  Reference,
  Hobby,
  CustomSection,
  generateId,
} from '@/lib/types/resume';
import { languageProficiencies } from '@/lib/resume-templates';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  X,
  Globe,
  Award as AwardIcon,
  Languages,
  BadgeCheck,
  Users,
  Heart,
  FileText,
  ChevronDown,
  ChevronUp,
} from '@/components/ui/icons';
import { useState } from 'react';

interface FinalizeFormProps {
  data: FinalizeOptions;
  onChange: (data: FinalizeOptions) => void;
}

interface SectionWrapperProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SectionWrapper({ title, icon, children, defaultOpen = false }: SectionWrapperProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0 border-t">{children}</div>}
    </div>
  );
}

export function FinalizeForm({ data, onChange }: FinalizeFormProps) {
  // Languages
  const addLanguage = () => {
    const newLanguage: Language = {
      id: generateId(),
      name: '',
      proficiency: 'Conversational',
    };
    onChange({ ...data, languages: [...data.languages, newLanguage] });
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    onChange({
      ...data,
      languages: data.languages.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      ),
    });
  };

  const removeLanguage = (id: string) => {
    onChange({
      ...data,
      languages: data.languages.filter((lang) => lang.id !== id),
    });
  };

  // Certifications
  const addCertification = () => {
    const newCert: Certification = {
      id: generateId(),
      name: '',
      issuer: '',
      date: '',
    };
    onChange({ ...data, certifications: [...data.certifications, newCert] });
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    });
  };

  const removeCertification = (id: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((cert) => cert.id !== id),
    });
  };

  // Awards
  const addAward = () => {
    const newAward: Award = {
      id: generateId(),
      title: '',
      issuer: '',
      date: '',
    };
    onChange({ ...data, awards: [...data.awards, newAward] });
  };

  const updateAward = (id: string, field: keyof Award, value: string) => {
    onChange({
      ...data,
      awards: data.awards.map((award) =>
        award.id === id ? { ...award, [field]: value } : award
      ),
    });
  };

  const removeAward = (id: string) => {
    onChange({
      ...data,
      awards: data.awards.filter((award) => award.id !== id),
    });
  };

  // Websites
  const addWebsite = () => {
    const newWebsite: Website = {
      id: generateId(),
      label: '',
      url: '',
    };
    onChange({ ...data, websites: [...data.websites, newWebsite] });
  };

  const updateWebsite = (id: string, field: keyof Website, value: string) => {
    onChange({
      ...data,
      websites: data.websites.map((site) =>
        site.id === id ? { ...site, [field]: value } : site
      ),
    });
  };

  const removeWebsite = (id: string) => {
    onChange({
      ...data,
      websites: data.websites.filter((site) => site.id !== id),
    });
  };

  // References
  const addReference = () => {
    const newRef: Reference = {
      id: generateId(),
      name: '',
      position: '',
      company: '',
      email: '',
      phone: '',
    };
    onChange({ ...data, references: [...data.references, newRef] });
  };

  const updateReference = (id: string, field: keyof Reference, value: string) => {
    onChange({
      ...data,
      references: data.references.map((ref) =>
        ref.id === id ? { ...ref, [field]: value } : ref
      ),
    });
  };

  const removeReference = (id: string) => {
    onChange({
      ...data,
      references: data.references.filter((ref) => ref.id !== id),
    });
  };

  // Hobbies
  const addHobby = () => {
    const newHobby: Hobby = {
      id: generateId(),
      name: '',
    };
    onChange({ ...data, hobbies: [...data.hobbies, newHobby] });
  };

  const updateHobby = (id: string, value: string) => {
    onChange({
      ...data,
      hobbies: data.hobbies.map((hobby) =>
        hobby.id === id ? { ...hobby, name: value } : hobby
      ),
    });
  };

  const removeHobby = (id: string) => {
    onChange({
      ...data,
      hobbies: data.hobbies.filter((hobby) => hobby.id !== id),
    });
  };

  // Custom Sections
  const addCustomSection = () => {
    const newSection: CustomSection = {
      id: generateId(),
      sectionName: '',
      description: '',
    };
    onChange({ ...data, customSections: [...data.customSections, newSection] });
  };

  const updateCustomSection = (id: string, field: keyof CustomSection, value: string) => {
    onChange({
      ...data,
      customSections: data.customSections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      ),
    });
  };

  const removeCustomSection = (id: string) => {
    onChange({
      ...data,
      customSections: data.customSections.filter((section) => section.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Finalize Your Resume</h2>
        <p className="text-muted-foreground">
          Add optional sections to make your resume stand out. Include only what's relevant to your target role.
        </p>
      </div>

      <div className="space-y-4">
        {/* Languages */}
        <SectionWrapper
          title={`Languages ${data.languages.length > 0 ? `(${data.languages.length})` : ''}`}
          icon={<Languages className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-3">
                <Input
                  placeholder="Language (e.g. Spanish)"
                  value={lang.name}
                  onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={lang.proficiency}
                  onValueChange={(value) => updateLanguage(lang.id, 'proficiency', value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageProficiencies.map((prof) => (
                      <SelectItem key={prof} value={prof}>
                        {prof}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLanguage(lang.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button onClick={addLanguage} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Language
            </Button>
          </div>
        </SectionWrapper>

        {/* Certifications */}
        <SectionWrapper
          title={`Certifications & Licenses ${data.certifications.length > 0 ? `(${data.certifications.length})` : ''}`}
          icon={<BadgeCheck className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between">
                  <Label>Certification</Label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeCertification(cert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Certification name"
                  value={cert.name}
                  onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Issuing organization"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                  />
                  <Input
                    placeholder="Date (MM/YYYY)"
                    value={cert.date}
                    onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button onClick={addCertification} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Certification
            </Button>
          </div>
        </SectionWrapper>

        {/* Awards */}
        <SectionWrapper
          title={`Awards & Honors ${data.awards.length > 0 ? `(${data.awards.length})` : ''}`}
          icon={<AwardIcon className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            {data.awards.map((award) => (
              <div key={award.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between">
                  <Label>Award</Label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeAward(award.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Award title"
                  value={award.title}
                  onChange={(e) => updateAward(award.id, 'title', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Issuing organization"
                    value={award.issuer}
                    onChange={(e) => updateAward(award.id, 'issuer', e.target.value)}
                  />
                  <Input
                    placeholder="Date (MM/YYYY)"
                    value={award.date}
                    onChange={(e) => updateAward(award.id, 'date', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button onClick={addAward} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Award
            </Button>
          </div>
        </SectionWrapper>

        {/* Websites & Social Media */}
        <SectionWrapper
          title={`Websites & Social Media ${data.websites.length > 0 ? `(${data.websites.length})` : ''}`}
          icon={<Globe className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            {data.websites.map((site) => (
              <div key={site.id} className="flex items-center gap-3">
                <Input
                  placeholder="Label (e.g. LinkedIn)"
                  value={site.label}
                  onChange={(e) => updateWebsite(site.id, 'label', e.target.value)}
                  className="w-1/3"
                />
                <Input
                  placeholder="URL"
                  value={site.url}
                  onChange={(e) => updateWebsite(site.id, 'url', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeWebsite(site.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button onClick={addWebsite} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Website
            </Button>
          </div>
        </SectionWrapper>

        {/* References */}
        <SectionWrapper
          title={`References ${data.references.length > 0 ? `(${data.references.length})` : ''}`}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            {data.references.map((ref) => (
              <div key={ref.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between">
                  <Label>Reference</Label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeReference(ref.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Full name"
                  value={ref.name}
                  onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Position"
                    value={ref.position}
                    onChange={(e) => updateReference(ref.id, 'position', e.target.value)}
                  />
                  <Input
                    placeholder="Company"
                    value={ref.company}
                    onChange={(e) => updateReference(ref.id, 'company', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Email"
                    value={ref.email}
                    onChange={(e) => updateReference(ref.id, 'email', e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={ref.phone}
                    onChange={(e) => updateReference(ref.id, 'phone', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button onClick={addReference} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Reference
            </Button>
          </div>
        </SectionWrapper>

        {/* Hobbies & Interests */}
        <SectionWrapper
          title={`Hobbies & Interests ${data.hobbies.length > 0 ? `(${data.hobbies.length})` : ''}`}
          icon={<Heart className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            <div className="flex flex-wrap gap-2">
              {data.hobbies.map((hobby) => (
                <div
                  key={hobby.id}
                  className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full"
                >
                  <Input
                    value={hobby.name}
                    onChange={(e) => updateHobby(hobby.id, e.target.value)}
                    className="border-0 bg-transparent p-0 h-auto w-auto min-w-[80px] focus-visible:ring-0"
                    placeholder="Hobby"
                  />
                  <button
                    onClick={() => removeHobby(hobby.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={addHobby} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Hobby
            </Button>
          </div>
        </SectionWrapper>

        {/* Custom Section */}
        <SectionWrapper
          title={`Custom Sections ${data.customSections.length > 0 ? `(${data.customSections.length})` : ''}`}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-3 pt-4">
            {data.customSections.map((section) => (
              <div key={section.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between">
                  <Label>Custom Section</Label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeCustomSection(section.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Section name (e.g. Volunteer Work)"
                  value={section.sectionName}
                  onChange={(e) =>
                    updateCustomSection(section.id, 'sectionName', e.target.value)
                  }
                />
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  placeholder="Description..."
                  value={section.description}
                  onChange={(e) =>
                    updateCustomSection(section.id, 'description', e.target.value)
                  }
                />
              </div>
            ))}
            <Button onClick={addCustomSection} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Section
            </Button>
          </div>
        </SectionWrapper>
      </div>
    </div>
  );
}
