import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const institutionSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').max(20),
  type: z.enum(['school', 'college', 'university']),
  address: z.string().optional().default(''),
  contactEmail: z.string().email('Invalid email').optional().default(''),
});

export const adminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name is required'),
  role: z.enum(['super_admin', 'institution_admin']),
  institutionId: z.string().optional().nullable(),
});

export const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  accessType: z.enum(['restricted', 'public']).default('restricted'),
  settings: z.object({
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    responseLimit: z.number().nullable().optional(),
    confirmationMessage: z.string().optional().default('Thank you for your response!'),
    allowedSections: z.array(z.string()).optional().default([]),
  }).optional(),
});

export const studentSchema = z.object({
  rollNumber: z.string().min(1, 'Roll number is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  department: z.string().optional().default(''),
  year: z.string().optional().default(''),
  section: z.string().optional().default(''),
});

export const otpSendSchema = z.object({
  formId: z.string().min(1),
  identifier: z.string().min(1, 'Identifier is required'),
});

export const otpVerifySchema = z.object({
  sessionId: z.string().min(1),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
