'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { CheckCircle, Star } from 'lucide-react';

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

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/public/${slug}`);
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
      toast.success('Verified!');
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
      if (field.required) {
        const answer = answers[field.id];
        if (!answer || !answer.value || (Array.isArray(answer.value) && answer.value.length === 0)) {
          toast.error(`"${field.label}" is required`);
          return;
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
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={(val) => updateAnswer(field.id, field.type, val)}
          >
            {field.options.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                <Label htmlFor={`${field.id}-${opt}`} className="text-sm normal-case tracking-normal font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${opt}`}
                    checked={checked}
                    onCheckedChange={(c) => {
                      const current = Array.isArray(value) ? value : [];
                      const updated = c
                        ? [...current, opt]
                        : current.filter((v) => v !== opt);
                      updateAnswer(field.id, field.type, updated);
                    }}
                  />
                  <Label htmlFor={`${field.id}-${opt}`} className="text-sm normal-case tracking-normal font-normal">{opt}</Label>
                </div>
              );
            })}
          </div>
        );

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

      default:
        return null;
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red border-t-transparent" />
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="glass-card w-full max-w-md text-center p-8">
          <p className="font-display text-2xl text-red">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="glass-card w-full max-w-md text-center p-8 space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="font-display text-3xl tracking-tight">Submitted!</h2>
          <p className="text-muted-foreground">{confirmationMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Form Header */}
        <div className="glass-card p-6">
          {institutionName && (
            <p className="label-ink mb-2">{institutionName}</p>
          )}
          <h1 className="font-display text-3xl tracking-tight">{form?.title}</h1>
          {form?.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
        </div>

        {/* OTP Identify Step */}
        {step === 'identify' && (
          <div className="glass-card p-6">
            <h2 className="font-display text-xl tracking-tight">Verify Your Identity</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {form?.accessType === 'restricted'
                ? 'Enter your roll number to receive an OTP'
                : 'Enter your email to receive an OTP'}
            </p>
            <form onSubmit={handleSendOtp} className="mt-4 space-y-4">
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
              <Button type="submit" className="w-full" disabled={sendingOtp}>
                {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          </div>
        )}

        {/* OTP Verify Step */}
        {step === 'otp' && (
          <div className="glass-card p-6">
            <h2 className="font-display text-xl tracking-tight">Enter OTP</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a 6-digit code to {maskedEmail}
            </p>
            <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={verifyingOtp}>
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
            {fields.map((field) => (
              <div key={field.id} className="glass-card p-5 space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red ml-1">*</span>}
                  </label>
                  {field.description && (
                    <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                  )}
                </div>
                {renderField(field)}
              </div>
            ))}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
