'use client';

import { Experience, generateId } from '@/lib/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { MonthPicker } from './month-picker';

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const addExperience = () => {
    const newExperience: Experience = {
      id: generateId(),
      jobTitle: '',
      employer: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      description: '',
    };
    onChange([...data, newExperience]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    onChange(
      data.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const removeExperience = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id));
  };

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newData = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Work Experience</h2>
        <p className="text-muted-foreground">
          List your work experience starting with the most recent position first.
        </p>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No work experience added yet.</p>
          <Button onClick={addExperience} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Work Experience
          </Button>
        </div>
      )}

      {data.map((experience, index) => (
        <div
          key={experience.id}
          className="border rounded-lg p-4 space-y-4 bg-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {experience.jobTitle || 'Job title'}, {experience.employer || 'Employer'}
              </p>
              <p className="text-xs text-muted-foreground">
                {experience.startDate || 'MM/YYYY'} - {experience.isCurrentJob ? 'Present' : (experience.endDate || 'MM/YYYY')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveExperience(index, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveExperience(index, 'down')}
                disabled={index === data.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeExperience(experience.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                placeholder="e.g. Junior Accountant"
                value={experience.jobTitle}
                onChange={(e) =>
                  updateExperience(experience.id, 'jobTitle', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Employer</Label>
              <Input
                placeholder="Company name"
                value={experience.employer}
                onChange={(e) =>
                  updateExperience(experience.id, 'employer', e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              placeholder="e.g. San Francisco, CA, USA"
              value={experience.location}
              onChange={(e) =>
                updateExperience(experience.id, 'location', e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <MonthPicker
                value={experience.startDate}
                onChange={(value) =>
                  updateExperience(experience.id, 'startDate', value)
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>End Date</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={experience.isCurrentJob}
                    onCheckedChange={(checked) =>
                      updateExperience(experience.id, 'isCurrentJob', checked)
                    }
                  />
                  <span className="text-sm text-muted-foreground">Current job</span>
                </div>
              </div>
              <MonthPicker
                value={experience.endDate}
                onChange={(value) =>
                  updateExperience(experience.id, 'endDate', value)
                }
                disabled={experience.isCurrentJob}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your responsibilities and achievements..."
              value={experience.description}
              onChange={(e) =>
                updateExperience(experience.id, 'description', e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Use bullet points to highlight key achievements. Start with action verbs.
            </p>
          </div>
        </div>
      ))}

      {data.length > 0 && (
        <Button onClick={addExperience} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Work Experience
        </Button>
      )}
    </div>
  );
}
