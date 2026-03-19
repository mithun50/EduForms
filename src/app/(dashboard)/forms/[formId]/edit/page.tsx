'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Save,
  Send,
  ArrowLeft,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  ChevronDown,
  Circle,
  CheckSquare,
  Calendar,
  Upload,
  Star,
  Minus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Form, FormField, FieldType } from '@/types';

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'radio', label: 'Radio', icon: Circle },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'file', label: 'File Upload', icon: Upload },
  { type: 'rating', label: 'Rating', icon: Star },
  { type: 'linear_scale', label: 'Linear Scale', icon: Minus },
];

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (!res.ok) throw new Error('Form not found');
      const data = await res.json();
      setForm(data.form);
      setFields(
        (data.fields || []).map((f: FormField) => ({
          ...f,
          id: f.id || uuid(),
        }))
      );
    } catch {
      toast.error('Failed to load form');
      router.push('/forms');
    } finally {
      setLoading(false);
    }
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: uuid(),
      type,
      label: '',
      description: '',
      required: false,
      order: fields.length,
      validation: {},
      options: type === 'dropdown' || type === 'radio' || type === 'checkbox' ? ['Option 1'] : [],
      scaleConfig: type === 'linear_scale' ? { min: 1, max: 5, minLabel: '', maxLabel: '' } : null,
      ratingConfig: type === 'rating' ? { maxStars: 5 } : null,
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  };

  const validateFieldLabels = (): boolean => {
    const emptyLabel = fields.find((f) => !f.label.trim());
    if (emptyLabel) {
      toast.error('All fields must have a label');
      setSelectedField(emptyLabel.id);
      return false;
    }
    return true;
  };

  const saveFields = async () => {
    if (!validateFieldLabels()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Fields saved');
    } catch {
      toast.error('Failed to save fields');
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    if (fields.length === 0) {
      toast.error('Add at least one field before publishing');
      return;
    }
    if (!validateFieldLabels()) return;

    // Save fields first
    await saveFields();

    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error);
      }
      const data = await res.json();
      toast.success('Form published!');
      setForm((prev) => prev ? { ...prev, status: 'published' } : prev);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const selected = fields.find((f) => f.id === selectedField);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/forms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{form?.title || 'Form Builder'}</h2>
            <p className="text-sm text-muted-foreground">{form?.description}</p>
          </div>
          {form?.status && (
            <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
              {form.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveFields} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {form?.status === 'draft' && (
            <Button onClick={publishForm} disabled={publishing}>
              <Send className="mr-2 h-4 w-4" />
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Canvas */}
        <div className="space-y-3">
          {fields.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">Add fields from the palette below</p>
              </CardContent>
            </Card>
          ) : (
            fields.map((field, index) => (
              <Card
                key={field.id}
                className={`cursor-pointer transition-colors ${
                  selectedField === field.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedField(field.id)}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                      disabled={index === fields.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        {FIELD_TYPES.find((t) => t.type === field.type)?.label}
                      </span>
                      {field.required && (
                        <span className="text-xs text-destructive">*Required</span>
                      )}
                    </div>
                    <p className="font-medium mt-1">
                      {field.label || <span className="text-muted-foreground italic">Untitled field</span>}
                    </p>
                    {field.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{field.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}

          {/* Field Palette */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Add Field</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {FIELD_TYPES.map((ft) => {
                  const Icon = ft.icon;
                  return (
                    <button
                      key={ft.type}
                      onClick={() => addField(ft.type)}
                      className="flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors hover:bg-accent"
                    >
                      <Icon className="h-4 w-4" />
                      {ft.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Field Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={selected.label}
                    onChange={(e) => updateField(selected.id, { label: e.target.value })}
                    placeholder="Enter field label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selected.description}
                    onChange={(e) => updateField(selected.id, { description: e.target.value })}
                    placeholder="Help text"
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Required</Label>
                  <Switch
                    checked={selected.required}
                    onCheckedChange={(checked) => updateField(selected.id, { required: checked })}
                  />
                </div>

                {/* Options for dropdown/radio/checkbox */}
                {['dropdown', 'radio', 'checkbox'].includes(selected.type) && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {selected.options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...selected.options];
                            newOpts[i] = e.target.value;
                            updateField(selected.id, { options: newOpts });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateField(selected.id, {
                              options: selected.options.filter((_, idx) => idx !== i),
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateField(selected.id, {
                          options: [...selected.options, `Option ${selected.options.length + 1}`],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Option
                    </Button>
                  </div>
                )}

                {/* Rating config */}
                {selected.type === 'rating' && selected.ratingConfig && (
                  <div className="space-y-2">
                    <Label>Max Stars</Label>
                    <Select
                      value={String(selected.ratingConfig.maxStars)}
                      onValueChange={(val) =>
                        updateField(selected.id, {
                          ratingConfig: { maxStars: Number(val) },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} stars
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Linear scale config */}
                {selected.type === 'linear_scale' && selected.scaleConfig && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Min</Label>
                        <Input
                          type="number"
                          value={selected.scaleConfig.min}
                          onChange={(e) =>
                            updateField(selected.id, {
                              scaleConfig: { ...selected.scaleConfig!, min: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Max</Label>
                        <Input
                          type="number"
                          value={selected.scaleConfig.max}
                          onChange={(e) =>
                            updateField(selected.id, {
                              scaleConfig: { ...selected.scaleConfig!, max: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Min Label</Label>
                      <Input
                        value={selected.scaleConfig.minLabel}
                        onChange={(e) =>
                          updateField(selected.id, {
                            scaleConfig: { ...selected.scaleConfig!, minLabel: e.target.value },
                          })
                        }
                        placeholder="e.g. Strongly Disagree"
                      />
                    </div>
                    <div>
                      <Label>Max Label</Label>
                      <Input
                        value={selected.scaleConfig.maxLabel}
                        onChange={(e) =>
                          updateField(selected.id, {
                            scaleConfig: { ...selected.scaleConfig!, maxLabel: e.target.value },
                          })
                        }
                        placeholder="e.g. Strongly Agree"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Select a field to edit its properties
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
