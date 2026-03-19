export interface Institution {
  id: string;
  name: string;
  code: string;
  type: 'school' | 'college' | 'university';
  address: string;
  logoUrl: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: string;
}

export interface Admin {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'institution_admin';
  institutionId: string | null;
  isActive: boolean;
  createdAt: string;
}

export type FormStatus = 'draft' | 'published' | 'closed';
export type FormAccessType = 'restricted' | 'public';

export interface FormSettings {
  startDate: string | null;
  endDate: string | null;
  responseLimit: number | null;
  confirmationMessage: string;
  allowedSections: string[];
}

export interface Form {
  id: string;
  institutionId: string;
  createdBy: string;
  title: string;
  description: string;
  status: FormStatus;
  accessType: FormAccessType;
  settings: FormSettings;
  responseCount: number;
  slug: string;
  createdAt: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'rating'
  | 'linear_scale';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface ScaleConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export interface RatingConfig {
  maxStars: number;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description: string;
  required: boolean;
  order: number;
  validation: FieldValidation;
  options: string[];
  scaleConfig: ScaleConfig | null;
  ratingConfig: RatingConfig | null;
}

export interface Student {
  id: string;
  institutionId: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  year: string;
  section: string;
  batchId: string;
  createdAt: string;
}

export interface FieldAnswer {
  fieldType: FieldType;
  value: string | string[] | number;
}

export interface FormResponse {
  id: string;
  formId: string;
  institutionId: string;
  respondentType: 'student' | 'public';
  respondentIdentifier: string;
  respondentEmail: string;
  answers: Record<string, FieldAnswer>;
  submittedAt: string;
}

export interface OtpSession {
  id: string;
  formId: string;
  identifier: string;
  email: string;
  otpHash: string;
  attempts: number;
  verified: boolean;
  expiresAt: string;
  createdAt: string;
}
