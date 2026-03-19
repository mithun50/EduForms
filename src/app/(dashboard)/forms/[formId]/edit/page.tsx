'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Plus,
  Trash2,
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
  Copy,
  ToggleRight,
  ToggleLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Form, FormField, FormSettings, FieldType } from '@/types';

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

  // Settings state
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsAccessType, setSettingsAccessType] = useState<'restricted' | 'public'>('restricted');
  const [settingsStartDate, setSettingsStartDate] = useState('');
  const [settingsEndDate, setSettingsEndDate] = useState('');
  const [settingsResponseLimit, setSettingsResponseLimit] = useState('');
  const [settingsConfirmationMessage, setSettingsConfirmationMessage] = useState('');
  const [settingsAllowedSections, setSettingsAllowedSections] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchForm();
    fetchSections();
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
      // Populate settings
      const f = data.form as Form;
      setSettingsTitle(f.title);
      setSettingsDescription(f.description || '');
      setSettingsAccessType(f.accessType);
      setSettingsStartDate(f.settings?.startDate || '');
      setSettingsEndDate(f.settings?.endDate || '');
      setSettingsResponseLimit(f.settings?.responseLimit ? String(f.settings.responseLimit) : '');
      setSettingsConfirmationMessage(f.settings?.confirmationMessage || 'Thank you for your response!');
      setSettingsAllowedSections(f.settings?.allowedSections || []);
    } catch {
      toast.error('Failed to load form');
      router.push('/forms');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/students/sections');
      if (res.ok) {
        const data = await res.json();
        setAvailableSections(data.sections || []);
      }
    } catch {
      // Sections are optional, no error needed
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

  const duplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: uuid(),
      label: `Copy of ${field.label}`,
      order: fields.length,
      options: [...field.options],
      scaleConfig: field.scaleConfig ? { ...field.scaleConfig } : null,
      ratingConfig: field.ratingConfig ? { ...field.ratingConfig } : null,
      validation: { ...field.validation },
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
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

    await saveFields();

    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error);
      }
      toast.success('Form published!');
      setForm((prev) => prev ? { ...prev, status: 'published' } : prev);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsTitle,
          description: settingsDescription,
          accessType: settingsAccessType,
          settings: {
            startDate: settingsStartDate || null,
            endDate: settingsEndDate || null,
            responseLimit: settingsResponseLimit ? Number(settingsResponseLimit) : null,
            confirmationMessage: settingsConfirmationMessage || 'Thank you for your response!',
            allowedSections: settingsAllowedSections,
          } as FormSettings,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Settings saved');
      setForm((prev) =>
        prev
          ? {
              ...prev,
              title: settingsTitle,
              description: settingsDescription,
              accessType: settingsAccessType,
              settings: {
                startDate: settingsStartDate || null,
                endDate: settingsEndDate || null,
                responseLimit: settingsResponseLimit ? Number(settingsResponseLimit) : null,
                confirmationMessage: settingsConfirmationMessage || 'Thank you for your response!',
                allowedSections: settingsAllowedSections,
              },
            }
          : prev
      );
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!form) return;
    const newStatus = form.status === 'published' ? 'closed' : 'published';
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(newStatus === 'closed' ? 'Form closed' : 'Form reopened');
      setForm((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch {
      toast.error('Failed to update form status');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Form deleted');
      router.push('/forms');
    } catch {
      toast.error('Failed to delete form');
    }
  };

  const selected = fields.find((f) => f.id === selectedField);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red border-t-transparent" />
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
            <h2 className="font-display text-2xl tracking-tight">{form?.title || 'Form Builder'}</h2>
            <p className="text-sm text-muted-foreground">{form?.description}</p>
          </div>
          {form?.status && (
            <Badge variant={form.status === 'published' ? 'default' : form.status === 'closed' ? 'destructive' : 'secondary'}>
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

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px] mt-4">
            {/* Canvas */}
            <div className="space-y-3">
              {fields.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-16">
                  <p className="text-muted-foreground">Add fields from the palette below</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`glass-card cursor-pointer p-4 transition-colors ${
                      selectedField === field.id ? 'border-red border-[2px]' : ''
                    }`}
                    onClick={() => setSelectedField(field.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                          disabled={index === 0}
                          className="text-muted-foreground hover:text-ink disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                          disabled={index === fields.length - 1}
                          className="text-muted-foreground hover:text-ink disabled:opacity-30"
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="label-ink">
                            {FIELD_TYPES.find((t) => t.type === field.type)?.label}
                          </span>
                          {field.required && (
                            <span className="text-[10px] uppercase tracking-[0.08em] font-extrabold text-red">*Required</span>
                          )}
                        </div>
                        <p className="font-medium mt-1">
                          {field.label || <span className="text-muted-foreground italic">Untitled field</span>}
                        </p>
                        {field.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{field.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); duplicateField(field); }}
                          className="text-muted-foreground hover:text-ink"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                          className="text-muted-foreground hover:text-red"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Field Palette */}
              <div className="glass-card p-4">
                <p className="label-ink mb-3">Add Field</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {FIELD_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.type}
                        onClick={() => addField(ft.type)}
                        className="flex flex-col items-center gap-1 rounded border-[1.5px] border-line p-3 text-xs transition-colors hover:bg-paper2"
                      >
                        <Icon className="h-4 w-4" />
                        {ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="space-y-4">
              {selected ? (
                <div className="glass-card p-4">
                  <p className="label-ink mb-3">Field Properties</p>
                  <div className="space-y-4">
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
                  </div>
                </div>
              ) : (
                <div className="glass-card py-8 text-center text-sm text-muted-foreground">
                  Select a field to edit its properties
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="mx-auto max-w-2xl mt-4 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <p className="label-ink">General</p>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={settingsTitle}
                  onChange={(e) => setSettingsTitle(e.target.value)}
                  placeholder="Form title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={settingsDescription}
                  onChange={(e) => setSettingsDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Type</Label>
                <Select
                  value={settingsAccessType}
                  onValueChange={(val: 'restricted' | 'public') => setSettingsAccessType(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restricted">Restricted (College students only)</SelectItem>
                    <SelectItem value="public">Public (Anyone with email)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settingsAccessType === 'restricted' && (
                <div className="space-y-2">
                  <Label>Restrict to Sections</Label>
                  <p className="text-xs text-muted-foreground">Leave empty to allow all sections</p>
                  {availableSections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableSections.map((section) => {
                        const isSelected = settingsAllowedSections.includes(section);
                        return (
                          <button
                            key={section}
                            type="button"
                            onClick={() => {
                              setSettingsAllowedSections(
                                isSelected
                                  ? settingsAllowedSections.filter((s) => s !== section)
                                  : [...settingsAllowedSections, section]
                              );
                            }}
                            className={`rounded border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-ink text-paper border-ink'
                                : 'border-line hover:bg-paper2'
                            }`}
                          >
                            {section}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Input
                      value={settingsAllowedSections.join(', ')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettingsAllowedSections(
                          val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []
                        );
                      }}
                      placeholder="e.g. A, B, C (comma-separated)"
                    />
                  )}
                  {settingsAllowedSections.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {settingsAllowedSections.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card p-6 space-y-4">
              <p className="label-ink">Scheduling & Limits</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={settingsStartDate}
                    onChange={(e) => setSettingsStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={settingsEndDate}
                    onChange={(e) => setSettingsEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Response Limit</Label>
                <Input
                  type="number"
                  value={settingsResponseLimit}
                  onChange={(e) => setSettingsResponseLimit(e.target.value)}
                  placeholder="No limit"
                  min={0}
                />
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <p className="label-ink">After Submission</p>
              <div className="space-y-2">
                <Label>Confirmation Message</Label>
                <Textarea
                  value={settingsConfirmationMessage}
                  onChange={(e) => setSettingsConfirmationMessage(e.target.value)}
                  placeholder="Thank you for your response!"
                  rows={3}
                />
              </div>
            </div>

            <Button onClick={saveSettings} disabled={savingSettings} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>

            {/* Form Actions */}
            <div className="glass-card p-6 space-y-4">
              <p className="label-ink">Form Actions</p>
              {(form?.status === 'published' || form?.status === 'closed') && (
                <Button variant="outline" className="w-full" onClick={handleToggleStatus}>
                  {form.status === 'published' ? (
                    <>
                      <ToggleRight className="mr-2 h-4 w-4" />
                      Close Form
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="mr-2 h-4 w-4" />
                      Reopen Form
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full text-red hover:text-red"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Form
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Form"
        description={`Are you sure you want to delete "${form?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
