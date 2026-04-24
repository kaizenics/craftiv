'use client';

import { Skill, generateId } from '@/lib/types/resume';
import { skillLevels } from '@/lib/resume-templates';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, X, Check } from '@/components/ui/icons';

interface SkillsFormProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const addSkill = () => {
    const newSkill: Skill = {
      id: generateId(),
      name: '',
      level: 'Intermediate',
      showLevel: true,
    };
    onChange([...data, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: string | boolean) => {
    onChange(
      data.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    );
  };

  const removeSkill = (id: string) => {
    onChange(data.filter((skill) => skill.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Skills</h2>
        <p className="text-muted-foreground">
          Add your professional skills. Include both technical and soft skills relevant to your target role.
        </p>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No skills added yet.</p>
          <Button onClick={addSkill} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {data.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-card"
          >
            <div className="flex-1">
              <Input
                placeholder="e.g. Next.js, Python, Project Management"
                value={skill.name}
                onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={skill.showLevel}
                onCheckedChange={(checked) =>
                  updateSkill(skill.id, 'showLevel', checked)
                }
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Show level
              </span>
            </div>

            {skill.showLevel && (
              <Select
                value={skill.level}
                onValueChange={(value) => updateSkill(skill.id, 'level', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeSkill(skill.id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <Button onClick={addSkill} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      )}

      {/* Quick Add Suggestions */}
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground mb-2">Quick add popular skills:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'JavaScript',
            'React',
            'TypeScript',
            'Node.js',
            'Python',
            'SQL',
            'Git',
            'Communication',
            'Leadership',
            'Problem Solving',
          ].map((skillName) => {
            const isAdded = data.some(
              (s) => s.name.toLowerCase() === skillName.toLowerCase()
            );
            return (
              <Button
                key={skillName}
                variant="outline"
                size="sm"
                disabled={isAdded}
                onClick={() => {
                  const newSkill: Skill = {
                    id: generateId(),
                    name: skillName,
                    level: 'Intermediate',
                    showLevel: true,
                  };
                  onChange([...data, newSkill]);
                }}
                className="text-xs"
              >
                {isAdded ? (
                  <>
                    <Check className="text-green-600 h-4 w-4" /> {skillName}
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" /> {skillName}
                  </>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
