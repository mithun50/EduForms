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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
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
  Eye,
  Layers,
  SeparatorHorizontal,
  Clock,
  Link2,
  Grid3x3,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Form, FormField, FormSettings, FieldType, TargetAudience } from '@/types';

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
  { type: 'section_break', label: 'Section Break', icon: SeparatorHorizontal },
  { type: 'time', label: 'Time', icon: Clock },
  { type: 'url', label: 'URL', icon: Link2 },
  { type: 'multiple_choice_grid', label: 'Grid (Radio)', icon: Grid3x3 },
  { type: 'checkbox_grid', label: 'Grid (Checkbox)', icon: Grid3x3 },
];

function PropertiesPanel({ selected, updateField, fields }: {
  selected: FormField;
  updateField: (id: string, updates: Partial<FormField>) => void;
  fields: FormField[];
}) {
  // Section break: only show label and description, no required toggle
  if (selected.type === 'section_break') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={selected.label}
            onChange={(e) => updateField(selected.id, { label: e.target.value })}
            placeholder="Section title"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={selected.description}
            onChange={(e) => updateField(selected.id, { description: e.target.value })}
            placeholder="Section description"
            rows={2}
          />
        </div>
      </div>
    );
  }

  return (
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
              <span>{selected.ratingConfig.maxStars} stars</span>
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

      {['multiple_choice_grid', 'checkbox_grid'].includes(selected.type) && selected.gridConfig && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rows</Label>
            {selected.gridConfig.rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={row}
                  onChange={(e) => {
                    const newRows = [...selected.gridConfig!.rows];
                    newRows[i] = e.target.value;
                    updateField(selected.id, {
                      gridConfig: { ...selected.gridConfig!, rows: newRows },
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    updateField(selected.id, {
                      gridConfig: {
                        ...selected.gridConfig!,
                        rows: selected.gridConfig!.rows.filter((_, idx) => idx !== i),
                      },
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
                  gridConfig: {
                    ...selected.gridConfig!,
                    rows: [...selected.gridConfig!.rows, `Row ${selected.gridConfig!.rows.length + 1}`],
                  },
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Row
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            {selected.gridConfig.columns.map((col, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={col}
                  onChange={(e) => {
                    const newCols = [...selected.gridConfig!.columns];
                    newCols[i] = e.target.value;
                    updateField(selected.id, {
                      gridConfig: { ...selected.gridConfig!, columns: newCols },
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    updateField(selected.id, {
                      gridConfig: {
                        ...selected.gridConfig!,
                        columns: selected.gridConfig!.columns.filter((_, idx) => idx !== i),
                      },
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
                  gridConfig: {
                    ...selected.gridConfig!,
                    columns: [...selected.gridConfig!.columns, `Column ${selected.gridConfig!.columns.length + 1}`],
                  },
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Column
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return <Input type={field.type === 'phone' ? 'tel' : field.type} placeholder={`Enter ${field.label.toLowerCase()}`} disabled />;
    case 'number':
      return <Input type="number" disabled />;
    case 'textarea':
      return <Textarea rows={3} disabled />;
    case 'date':
      return <Input type="date" disabled />;
    case 'dropdown':
      return (
        <Select disabled>
          <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-line" />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-line" />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'rating':
      const maxStars = field.ratingConfig?.maxStars || 5;
      return (
        <div className="flex gap-1">
          {Array.from({ length: maxStars }, (_, i) => (
            <Star key={i} className="h-6 w-6 text-muted-foreground" />
          ))}
        </div>
      );
    case 'linear_scale':
      const min = field.scaleConfig?.min || 1;
      const max = field.scaleConfig?.max || 5;
      return (
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{field.scaleConfig?.minLabel || min}</span>
            <span>{field.scaleConfig?.maxLabel || max}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: max - min + 1 }, (_, i) => (
              <div key={i} className="flex h-10 w-10 items-center justify-center rounded border-[1.5px] border-line text-sm font-medium">
                {min + i}
              </div>
            ))}
          </div>
        </div>
      );
    case 'file':
      return <Input type="file" disabled />;
    case 'section_break':
      return (
        <div className="border-t border-line pt-4">
          <p className="font-display text-lg">{field.label}</p>
          {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
        </div>
      );
    case 'time':
      return <Input type="time" disabled />;
    case 'url':
      return <Input type="url" placeholder="https://..." disabled />;
    case 'multiple_choice_grid':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2"></th>
                {(field.gridConfig?.columns || []).map((col, i) => (
                  <th key={i} className="p-2 text-center font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(field.gridConfig?.rows || []).map((row, ri) => (
                <tr key={ri} className="border-t border-line">
                  <td className="p-2 font-medium">{row}</td>
                  {(field.gridConfig?.columns || []).map((_, ci) => (
                    <td key={ci} className="p-2 text-center">
                      <div className="mx-auto h-4 w-4 rounded-full border-2 border-line" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'checkbox_grid':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2"></th>
                {(field.gridConfig?.columns || []).map((col, i) => (
                  <th key={i} className="p-2 text-center font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(field.gridConfig?.rows || []).map((row, ri) => (
                <tr key={ri} className="border-t border-line">
                  <td className="p-2 font-medium">{row}</td>
                  {(field.gridConfig?.columns || []).map((_, ci) => (
                    <td key={ci} className="p-2 text-center">
                      <div className="mx-auto h-4 w-4 rounded border-2 border-line" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Settings state
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsAccessType, setSettingsAccessType] = useState<'restricted' | 'public'>('restricted');
  const [settingsStartDate, setSettingsStartDate] = useState('');
  const [settingsEndDate, setSettingsEndDate] = useState('');
  const [settingsResponseLimit, setSettingsResponseLimit] = useState('');
  const [settingsConfirmationMessage, setSettingsConfirmationMessage] = useState('');
  const [settingsAllowedSections, setSettingsAllowedSections] = useState<string[]>([]);
  const [settingsAllowedYears, setSettingsAllowedYears] = useState<string[]>([]);
  const [settingsAllowedDepartments, setSettingsAllowedDepartments] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [settingsTargetMode, setSettingsTargetMode] = useState<'all' | 'filter' | 'upload'>('all');
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchForm();
    fetchFilterOptions();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Form not found');
      const data = await res.json();
      setForm(data.form);
      setFields(
        (data.fields || []).map((f: FormField) => ({
          ...f,
          id: f.id || uuid(),
        }))
      );
      const f = data.form as Form;
      setSettingsTitle(f.title);
      setSettingsDescription(f.description || '');
      setSettingsAccessType(f.accessType);
      setSettingsStartDate(f.settings?.startDate || '');
      setSettingsEndDate(f.settings?.endDate || '');
      setSettingsResponseLimit(f.settings?.responseLimit ? String(f.settings.responseLimit) : '');
      setSettingsConfirmationMessage(f.settings?.confirmationMessage || 'Thank you for your response!');
      setSettingsAllowedSections(f.settings?.allowedSections || []);
      setSettingsAllowedYears(f.settings?.allowedYears || []);
      setSettingsAllowedDepartments(f.settings?.allowedDepartments || []);
      setSettingsTargetMode(f.settings?.targetAudience?.mode || 'all');
    } catch {
      toast.error('Failed to load form');
      router.push('/forms');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch('/api/students/sections', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAvailableSections(data.sections || []);
        setAvailableYears(data.years || []);
        setAvailableDepartments(data.departments || []);
      }
    } catch {
      // Filter options are optional
    }
  };

  const addField = (type: FieldType) => {
    const isGridType = type === 'multiple_choice_grid' || type === 'checkbox_grid';
    const newField: FormField = {
      id: uuid(),
      type,
      label: '',
      description: '',
      required: type === 'section_break' ? false : false,
      order: fields.length,
      validation: {},
      options: type === 'dropdown' || type === 'radio' || type === 'checkbox' ? ['Option 1'] : [],
      scaleConfig: type === 'linear_scale' ? { min: 1, max: 5, minLabel: '', maxLabel: '' } : null,
      ratingConfig: type === 'rating' ? { maxStars: 5 } : null,
      gridConfig: isGridType ? { rows: ['Row 1'], columns: ['Column 1'] } : null,
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
      setSheetOpen(false);
    }
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
      gridConfig: field.gridConfig ? { rows: [...field.gridConfig.rows], columns: [...field.gridConfig.columns] } : null,
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
            allowedYears: settingsAllowedYears,
            allowedDepartments: settingsAllowedDepartments,
            targetAudience: {
              mode: settingsTargetMode,
              filters: {
                sections: settingsAllowedSections,
                years: settingsAllowedYears,
                departments: settingsAllowedDepartments,
              },
            } as TargetAudience,
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
                allowedYears: settingsAllowedYears,
                allowedDepartments: settingsAllowedDepartments,
                targetAudience: {
                  mode: settingsTargetMode,
                  filters: {
                    sections: settingsAllowedSections,
                    years: settingsAllowedYears,
                    departments: settingsAllowedDepartments,
                  },
                },
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

  const handleFieldClick = (fieldId: string) => {
    setSelectedField(fieldId);
    // On mobile, open sheet
    if (window.innerWidth < 1024) {
      setSheetOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="hidden lg:block h-64" />
        </div>
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
          {fields.length > 0 && (
            <Badge variant="outline" className="hidden sm:flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={fields.length === 0}>
            <Eye className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
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
          <div className="grid gap-4 lg:grid-cols-[1fr_300px] mt-4">
            {/* Canvas */}
            <div className="space-y-2">
              {fields.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 mb-4">
                    <Plus className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No fields yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Add fields from the palette below</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`glass-card cursor-pointer p-4 transition-all duration-150 ${
                      selectedField === field.id ? 'ring-2 ring-red/60 border-red/30' : 'hover:shadow-md'
                    }`}
                    onClick={() => handleFieldClick(field.id)}
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
                          className="text-muted-foreground hover:text-ink h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                          className="text-muted-foreground hover:text-red h-8 w-8"
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
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-line p-3 text-xs transition-all duration-150 hover:bg-paper2 hover:shadow-sm hover:-translate-y-0.5"
                      >
                        <Icon className="h-4 w-4" />
                        {ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Desktop Properties Panel */}
            <div className="hidden lg:block space-y-4">
              {selected ? (
                <div className="glass-card p-4">
                  <p className="label-ink mb-3">Field Properties</p>
                  <PropertiesPanel selected={selected} updateField={updateField} fields={fields} />
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsAccessType('restricted')}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      settingsAccessType === 'restricted'
                        ? 'border-red bg-red/5 ring-1 ring-red/30'
                        : 'border-line hover:bg-paper2'
                    }`}
                  >
                    <p className="text-sm font-medium">Restricted</p>
                    <p className="text-xs text-muted-foreground mt-0.5">College students only</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsAccessType('public')}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      settingsAccessType === 'public'
                        ? 'border-red bg-red/5 ring-1 ring-red/30'
                        : 'border-line hover:bg-paper2'
                    }`}
                  >
                    <p className="text-sm font-medium">Public</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Anyone with email</p>
                  </button>
                </div>
              </div>
              {settingsAccessType === 'restricted' && (
                <>
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

                  <div className="space-y-2">
                    <Label>Restrict to Years</Label>
                    <p className="text-xs text-muted-foreground">Leave empty to allow all years</p>
                    {availableYears.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableYears.map((year) => {
                          const isSelected = settingsAllowedYears.includes(year);
                          return (
                            <button
                              key={year}
                              type="button"
                              onClick={() => {
                                setSettingsAllowedYears(
                                  isSelected
                                    ? settingsAllowedYears.filter((y) => y !== year)
                                    : [...settingsAllowedYears, year]
                                );
                              }}
                              className={`rounded border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-ink text-paper border-ink'
                                  : 'border-line hover:bg-paper2'
                              }`}
                            >
                              {year}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        value={settingsAllowedYears.join(', ')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettingsAllowedYears(
                            val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []
                          );
                        }}
                        placeholder="e.g. 1st, 2nd, 3rd (comma-separated)"
                      />
                    )}
                    {settingsAllowedYears.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {settingsAllowedYears.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Restrict to Departments</Label>
                    <p className="text-xs text-muted-foreground">Leave empty to allow all departments</p>
                    {availableDepartments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableDepartments.map((dept) => {
                          const isSelected = settingsAllowedDepartments.includes(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => {
                                setSettingsAllowedDepartments(
                                  isSelected
                                    ? settingsAllowedDepartments.filter((d) => d !== dept)
                                    : [...settingsAllowedDepartments, dept]
                                );
                              }}
                              className={`rounded border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-ink text-paper border-ink'
                                  : 'border-line hover:bg-paper2'
                              }`}
                            >
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        value={settingsAllowedDepartments.join(', ')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettingsAllowedDepartments(
                            val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []
                          );
                        }}
                        placeholder="e.g. CSE, ECE, ME (comma-separated)"
                      />
                    )}
                    {settingsAllowedDepartments.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {settingsAllowedDepartments.join(', ')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Target Audience */}
            <div className="glass-card p-6 space-y-4">
              <p className="label-ink">Target Audience</p>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsTargetMode('all')}
                    className={`rounded border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                      settingsTargetMode === 'all'
                        ? 'bg-ink text-paper border-ink'
                        : 'border-line hover:bg-paper2'
                    }`}
                  >
                    All eligible students
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTargetMode('filter')}
                    className={`rounded border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                      settingsTargetMode === 'filter'
                        ? 'bg-ink text-paper border-ink'
                        : 'border-line hover:bg-paper2'
                    }`}
                  >
                    Filtered by restrictions above
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTargetMode('upload')}
                    className={`rounded border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                      settingsTargetMode === 'upload'
                        ? 'bg-ink text-paper border-ink'
                        : 'border-line hover:bg-paper2'
                    }`}
                  >
                    Specific students (upload CSV)
                  </button>
                </div>
                {settingsTargetMode === 'upload' && (
                  <p className="text-xs text-muted-foreground">
                    You can upload a CSV of specific student identifiers via the Students page.
                  </p>
                )}
              </div>
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

      {/* Mobile Properties Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>Field Properties</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4">
              <PropertiesPanel selected={selected} updateField={updateField} fields={fields} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="glass-card p-5">
              <h2 className="font-display text-2xl tracking-tight">{form?.title}</h2>
              {form?.description && (
                <p className="text-muted-foreground mt-1">{form.description}</p>
              )}
            </div>
            {fields.map((field) => (
              <div key={field.id} className="glass-card p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    {field.label || 'Untitled field'}
                    {field.required && <span className="text-red ml-1">*</span>}
                  </label>
                  {field.description && (
                    <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                  )}
                </div>
                <PreviewField field={field} />
              </div>
            ))}
            {fields.length > 0 && (
              <Button className="w-full" disabled>
                Submit
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
