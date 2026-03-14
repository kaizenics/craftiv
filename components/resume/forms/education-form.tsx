'use client';

import { Education, generateId } from '@/lib/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { MonthPicker } from './month-picker';

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const addEducation = () => {
    const newEducation: Education = {
      id: generateId(),
      schoolName: '',
      location: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    onChange([...data, newEducation]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange(
      data.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    );
  };

  const removeEducation = (id: string) => {
    onChange(data.filter((edu) => edu.id !== id));
  };

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const newData = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Education</h2>
        <p className="text-muted-foreground">
          Add your educational background. List your highest degree first.
        </p>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No education added yet.</p>
          <Button onClick={addEducation} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Education
          </Button>
        </div>
      )}

      {data.map((education, index) => (
        <div
          key={education.id}
          className="border rounded-lg p-4 space-y-4 bg-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {education.degree || 'Degree'}, {education.schoolName || 'School name'}
              </p>
              <p className="text-xs text-muted-foreground">
                {education.startDate || 'MM/YYYY'} - {education.endDate || 'MM/YYYY'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveEducation(index, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveEducation(index, 'down')}
                disabled={index === data.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEducation(education.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input
                placeholder="e.g. University of California"
                value={education.schoolName}
                onChange={(e) =>
                  updateEducation(education.id, 'schoolName', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Los Angeles, CA"
                value={education.location}
                onChange={(e) =>
                  updateEducation(education.id, 'location', e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Degree</Label>
            <Input
              placeholder="e.g. Bachelor of Science in Computer Science"
              value={education.degree}
              onChange={(e) =>
                updateEducation(education.id, 'degree', e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <MonthPicker
                value={education.startDate}
                onChange={(value) =>
                  updateEducation(education.id, 'startDate', value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>End Date (or Expected)</Label>
              <MonthPicker
                value={education.endDate}
                onChange={(value) =>
                  updateEducation(education.id, 'endDate', value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <textarea
              className="w-full min-h-25 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Relevant coursework, honors, activities..."
              value={education.description}
              onChange={(e) =>
                updateEducation(education.id, 'description', e.target.value)
              }
            />
          </div>
        </div>
      ))}

      {data.length > 0 && (
        <Button onClick={addEducation} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Education
        </Button>
      )}
    </div>
  );
}
