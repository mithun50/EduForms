'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { FormField } from '@/types';
import { Footer } from '@/components/ui/footer';
import { LoadingScreen } from '@/components/ui/loading';
import { CheckCircle, Star, AlertCircle, Home } from 'lucide-react';

type Step = 'loading' | 'error' | 'identify' | 'otp' | 'fill' | 'success';

interface FormData {
  id: string;
  title: string;
  description: string;
  accessType: 'restricted' | 'public';
  settings: {
    confirmationMessage?: string;
  };
}

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [step, setStep] = useState<Step>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState<FormData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [institutionName, setInstitutionName] = useState('');

  // OTP state
  const [identifier, setIdentifier] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Form answers
  const [answers, setAnswers] = useState<Record<string, { fieldType: string; value: string | string[] | number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Progress calculation
  const progress = useMemo(() => {
    const requiredFields = fields.filter((f) => f.required);
    if (requiredFields.length === 0) return 100;
    const filledCount = requiredFields.filter((f) => {
      const answer = answers[f.id];
      if (!answer || !answer.value) return false;
      if (Array.isArray(answer.value)) return answer.value.length > 0;
      return String(answer.value).trim() !== '';
    }).length;
    return Math.round((filledCount / requiredFields.length) * 100);
  }, [fields, answers]);

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/public/${slug}`, { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || 'Form not available');
        setStep('error');
        return;
      }
      const data = await res.json();
      setForm(data.form);
      setFields(data.fields);
      setInstitutionName(data.institutionName);
      setStep('identify');
    } catch {
      setErrorMessage('Failed to load form');
      setStep('error');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form!.id, identifier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setMaskedEmail(data.maskedEmail);
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

      setVerifiedEmail(data.email);
      if (data.existingAnswers) {
        setAnswers(data.existingAnswers);
        setIsEditing(true);
        toast.success('Verified! Your previous response has been loaded for editing.');
      } else {
        toast.success('Verified!');
      }
      setStep('fill');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const updateAnswer = (fieldId: string, fieldType: string, value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: { fieldType, value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const field of fields) {
      if (field.type === 'section_break') continue;
      if (field.required) {
        const answer = answers[field.id];
        if (!answer || !answer.value || (Array.isArray(answer.value) && answer.value.length === 0)) {
          toast.error(`"${field.label}" is required`);
          return;
        }
        // Grid fields: check all rows have a selection
        if (field.type === 'multiple_choice_grid' && field.gridConfig) {
          const gridVal = (typeof answer.value === 'object' && !Array.isArray(answer.value)) ? answer.value as Record<string, string> : {};
          const missingRow = field.gridConfig.rows.find((row) => !gridVal[row]);
          if (missingRow) {
            toast.error(`"${field.label}" requires a selection for "${missingRow}"`);
            return;
          }
        }
        if (field.type === 'checkbox_grid' && field.gridConfig) {
          const gridVal = (typeof answer.value === 'object' && !Array.isArray(answer.value)) ? answer.value as Record<string, string[]> : {};
          const missingRow = field.gridConfig.rows.find((row) => !gridVal[row] || gridVal[row].length === 0);
          if (missingRow) {
            toast.error(`"${field.label}" requires a selection for "${missingRow}"`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/submit/${form!.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setConfirmationMessage(data.message);
      setStep('success');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const answer = answers[field.id];
    const value = answer?.value;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
            rows={4}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
          />
        );

      case 'dropdown':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => updateAnswer(field.id, field.type, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateAnswer(field.id, field.type, opt)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-red bg-red/5 ring-1 ring-red/30'
                      : 'border-line hover:bg-paper2'
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? 'border-red' : 'border-line'
                  }`}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-red" />}
                  </div>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        );

      case 'checkbox': {
        const maxSel = field.validation?.maxSelections;
        const currentSelections = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {maxSel && (
              <p className="text-xs text-muted-foreground">Select up to {maxSel} option{maxSel !== 1 ? 's' : ''}</p>
            )}
            {field.options.map((opt) => {
              const checked = currentSelections.includes(opt);
              const atLimit = maxSel ? currentSelections.length >= maxSel && !checked : false;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={atLimit}
                  onClick={() => {
                    const updated = checked
                      ? currentSelections.filter((v) => v !== opt)
                      : [...currentSelections, opt];
                    updateAnswer(field.id, field.type, updated);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    checked
                      ? 'border-red bg-red/5 ring-1 ring-red/30'
                      : atLimit
                        ? 'border-line/50 opacity-50 cursor-not-allowed'
                        : 'border-line hover:bg-paper2'
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                    checked ? 'bg-red border-2 border-red' : 'border-2 border-line'
                  }`}>
                    {checked && (
                      <svg className="h-3 w-3 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'rating':
        const maxStars = field.ratingConfig?.maxStars || 5;
        const currentRating = Number(value) || 0;
        return (
          <div className="flex gap-1">
            {Array.from({ length: maxStars }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => updateAnswer(field.id, field.type, i + 1)}
                className="transition-colors"
              >
                <Star
                  className={`h-8 w-8 ${
                    i < currentRating
                      ? 'fill-red text-red'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        );

      case 'linear_scale':
        const min = field.scaleConfig?.min || 1;
        const max = field.scaleConfig?.max || 5;
        const currentScale = Number(value) || 0;
        return (
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{field.scaleConfig?.minLabel || min}</span>
              <span>{field.scaleConfig?.maxLabel || max}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: max - min + 1 }, (_, i) => {
                const val = min + i;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateAnswer(field.id, field.type, val)}
                    className={`flex h-10 w-10 items-center justify-center rounded border-[1.5px] text-sm font-medium transition-colors ${
                      currentScale === val
                        ? 'bg-ink text-paper border-ink'
                        : 'border-line hover:bg-paper2'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) updateAnswer(field.id, field.type, file.name);
            }}
          />
        );

      case 'section_break':
        return (
          <div className="border-t border-line/40 pt-2">
            {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
          </div>
        );

      case 'time':
        return (
          <Input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
            placeholder="https://..."
          />
        );

      case 'multiple_choice_grid': {
        const gridValue = (typeof value === 'object' && value !== null && !Array.isArray(value)) ? value as Record<string, string> : {};
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2"></th>
                  {field.gridConfig?.columns.map((col) => (
                    <th key={col} className="p-2 text-center font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.gridConfig?.rows.map((row) => (
                  <tr key={row} className="border-t border-line/30">
                    <td className="p-2 font-medium">{row}</td>
                    {field.gridConfig?.columns.map((col) => (
                      <td key={col} className="p-2 text-center">
                        <input
                          type="radio"
                          name={`${field.id}-${row}`}
                          checked={gridValue[row] === col}
                          onChange={() => {
                            const newVal = { ...gridValue, [row]: col };
                            updateAnswer(field.id, field.type, newVal as any);
                          }}
                          className="h-4 w-4 accent-red"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'checkbox_grid': {
        const cbGridValue = (typeof value === 'object' && value !== null && !Array.isArray(value)) ? value as Record<string, string[]> : {};
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2"></th>
                  {field.gridConfig?.columns.map((col) => (
                    <th key={col} className="p-2 text-center font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.gridConfig?.rows.map((row) => (
                  <tr key={row} className="border-t border-line/30">
                    <td className="p-2 font-medium">{row}</td>
                    {field.gridConfig?.columns.map((col) => {
                      const rowSelections = cbGridValue[row] || [];
                      const isChecked = rowSelections.includes(col);
                      return (
                        <td key={col} className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const currentRow = cbGridValue[row] || [];
                              const updatedRow = isChecked
                                ? currentRow.filter((c) => c !== col)
                                : [...currentRow, col];
                              const newVal = { ...cbGridValue, [row]: updatedRow };
                              updateAnswer(field.id, field.type, newVal as any);
                            }}
                            className="h-4 w-4 accent-red"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'single_checkbox':
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value === 'yes'}
              onChange={(e) => updateAnswer(field.id, field.type, e.target.checked ? 'yes' : '')}
              className="h-5 w-5 accent-red rounded"
            />
            <span className="text-sm">{field.label}</span>
          </div>
        );

      case 'date_time':
        return (
          <Input
            type="datetime-local"
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(field.id, field.type, e.target.value)}
          />
        );

      case 'range': {
        const rangeMin = field.validation?.min ?? 0;
        const rangeMax = field.validation?.max ?? 100;
        const rangeVal = Number(value) || rangeMin;
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={rangeMin}
              max={rangeMax}
              value={rangeVal}
              onChange={(e) => updateAnswer(field.id, field.type, Number(e.target.value))}
              className="w-full accent-red"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{rangeMin}</span>
              <span className="font-medium text-ink text-sm">{rangeVal}</span>
              <span>{rangeMax}</span>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Loading state
  if (step === 'loading') {
    return <LoadingScreen message="Loading form..." />;
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="glass-card w-full max-w-md text-center p-10 space-y-5 shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red/10 mx-auto">
              <AlertCircle className="h-8 w-8 text-red" />
            </div>
            <p className="font-display text-2xl">{errorMessage}</p>
            <Link href="/">
              <Button variant="outline" className="rounded-full px-6">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="glass-card w-full max-w-md text-center p-10 space-y-5 shadow-lg animate-scale-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="font-display text-3xl tracking-tight">
              {isEditing ? 'Response Updated!' : 'Submitted!'}
            </h2>
            <p className="text-muted-foreground">{confirmationMessage}</p>
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => window.location.reload()}
            >
              {isEditing ? 'Edit response again' : 'Submit another response'}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Progress bar */}
      {step === 'fill' && (
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Form Header */}
          <div className="glass-card p-6 sm:p-8 shadow-sm">
            {institutionName && (
              <p className="label-ink mb-3">{institutionName}</p>
            )}
            <h1 className="font-display text-3xl sm:text-4xl tracking-tight">{form?.title}</h1>
            {form?.description && <p className="text-muted-foreground mt-2 leading-relaxed">{form.description}</p>}
          </div>

          {/* OTP Identify Step */}
          {step === 'identify' && (
            <div className="glass-card p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-xl tracking-tight">Verify Your Identity</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {form?.accessType === 'restricted'
                  ? 'Enter your roll number to receive an OTP'
                  : 'Enter your email to receive an OTP'}
              </p>
              <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>
                    {form?.accessType === 'restricted' ? 'Roll Number' : 'Email'}
                  </Label>
                  <Input
                    type={form?.accessType === 'public' ? 'email' : 'text'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      form?.accessType === 'restricted'
                        ? 'Enter your roll number'
                        : 'Enter your email'
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={sendingOtp}>
                  {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            </div>
          )}

          {/* OTP Verify Step */}
          {step === 'otp' && (
            <div className="glass-card p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-xl tracking-tight">Enter OTP</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a 6-digit code to {maskedEmail}
              </p>
              <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>OTP Code</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest h-14"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={verifyingOtp}>
                  {verifyingOtp ? 'Verifying...' : 'Verify'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('identify')}
                >
                  Back
                </Button>
              </form>
            </div>
          )}

          {/* Form Fill Step */}
          {step === 'fill' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isEditing && (
                <div className="glass-card border-red/30 bg-red/5 p-4 text-sm text-muted-foreground rounded-lg">
                  You have already submitted this form. You can edit your response below and re-submit while the form is open.
                </div>
              )}
              {fields.map((field) => (
                <div key={field.id} className="glass-card p-5 sm:p-6 space-y-3 shadow-sm">
                  <div>
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && field.type !== 'section_break' && <span className="text-red ml-1">*</span>}
                    </label>
                    {field.type !== 'section_break' && field.description && (
                      <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                    )}
                  </div>
                  {renderField(field)}
                </div>
              ))}

              <Button type="submit" className="w-full h-12" size="lg" disabled={submitting}>
                {submitting ? 'Submitting...' : isEditing ? 'Update Response' : 'Submit'}
              </Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
