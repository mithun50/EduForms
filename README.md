# EduForms

A multi-institution form management platform built for education. Create, distribute, and analyze forms with OTP-verified submissions, role-based access control, and per-institution data isolation.

Built by **Mithun Gowda B** (mithungowda.b7411@gmail.com)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Features](#features)
7. [User Roles](#user-roles)
8. [Project Structure](#project-structure)
9. [Deployment](#deployment)
10. [License](#license)

---

## Project Overview

EduForms is a platform that lets educational institutions create forms, distribute them to students, and analyze responses. Key capabilities include:

- Multi-institution support with strict data isolation per institution.
- OTP-verified form submissions to ensure respondent identity.
- A drag-and-drop form builder supporting 17 field types.
- Response analytics with charts and CSV/XLSX export.
- Role-based access: super admins manage the platform, institution admins manage their own data.
- Targeted form distribution by section, year, department, or specific student lists.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Database | Firebase Firestore |
| Authentication | Firebase Auth + Firebase Admin SDK |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Charts | Recharts 3 |
| State Management | Zustand 5 |
| Validation | Zod 4 |
| Email (OTP) | Brevo (Sendinblue) via REST API |
| CSV/Spreadsheet | PapaParse + XLSX |
| Drag and Drop | dnd-kit (core + sortable) |
| Icons | Lucide React |
| Notifications | Sonner (toast) |
| Password Hashing | bcryptjs (OTP hashing) |
| Unique IDs | uuid |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Firebase project with Firestore and Authentication enabled
- A Brevo (Sendinblue) account for sending OTP emails

### 1. Clone the repository

```bash
git clone https://github.com/your-username/EduForms.git
cd EduForms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root with the following variables:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin SDK (JSON string of the full service account key)
FIREBASE_SERVICE_ACCOUNT=

# Brevo Email Service
# Supports a single key or comma-separated keys for multi-key rotation
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain (e.g. `project.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID (optional) |
| `FIREBASE_SERVICE_ACCOUNT` | Full service account JSON as a single-line string |
| `BREVO_API_KEY` | Brevo API key (or comma-separated list for rotation) |
| `BREVO_SENDER_EMAIL` | Sender email address for OTP emails |
| `BREVO_SENDER_NAME` | Display name for the sender |

### 4. Seed the super admin

```bash
npx tsx scripts/seed-admin.ts
```

This creates the initial super admin with **default credentials**:

| Field | Default Value |
|-------|---------------|
| Email | `admin@eduforms.com` |
| Password | `admin123456` |
| Name | `Super Admin` |

To use custom credentials, pass them as arguments:

```bash
npx tsx scripts/seed-admin.ts your@email.com yourpassword "Your Name"
```

If the email already exists in Firebase Auth, the script reuses that user and creates/updates the admin document in Firestore.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

All data is stored in Firebase Firestore. Below are the top-level collections and their fields.

### `institutions`

| Field | Type | Description |
|---|---|---|
| id | string | Document ID |
| name | string | Institution name |
| code | string | Short code (unique identifier) |
| type | string | Institution type (e.g. university, college) |
| address | string | Physical address |
| logoUrl | string | URL to institution logo |
| contactEmail | string | Primary contact email |
| isActive | boolean | Whether the institution is active |
| createdAt | timestamp | Creation timestamp |

### `admins`

| Field | Type | Description |
|---|---|---|
| uid | string | Firebase Auth UID (document ID) |
| email | string | Admin email |
| displayName | string | Display name |
| role | string | `super_admin` or `institution_admin` |
| institutionId | string | Linked institution (null for super_admin) |
| isActive | boolean | Whether the admin account is active |
| createdAt | timestamp | Creation timestamp |

### `forms`

| Field | Type | Description |
|---|---|---|
| id | string | Document ID |
| institutionId | string | Owning institution |
| createdBy | string | Admin UID who created the form |
| title | string | Form title |
| description | string | Form description |
| status | string | `draft` or `published` |
| accessType | string | `restricted` (institution students) or `public` |
| settings.startDate | timestamp | Form open date |
| settings.endDate | timestamp | Form close date |
| settings.responseLimit | number | Maximum responses allowed |
| settings.confirmationMessage | string | Message shown after submission |
| settings.allowedSections | array | Restrict to specific sections |
| settings.allowedYears | array | Restrict to specific years |
| settings.allowedDepartments | array | Restrict to specific departments |
| settings.targetAudience | array | Specific student emails (CSV upload) |
| responseCount | number | Current number of responses |
| slug | string | Public URL slug |
| createdAt | timestamp | Creation timestamp |

### `forms/{formId}/fields` (subcollection)

| Field | Type | Description |
|---|---|---|
| id | string | Field ID |
| type | string | Field type (see Features section for all 17 types) |
| label | string | Field label / question text |
| description | string | Help text or description |
| required | boolean | Whether the field is mandatory |
| order | number | Display order |
| validation | object | Validation rules (min, max, pattern, etc.) |
| options | array | Options for dropdown, radio, checkbox fields |
| scaleConfig | object | Configuration for linear_scale fields |
| ratingConfig | object | Configuration for rating fields |
| gridConfig | object | Configuration for grid fields (rows, columns) |

### `students`

| Field | Type | Description |
|---|---|---|
| id | string | Document ID |
| institutionId | string | Owning institution |
| rollNumber | string | Student roll/registration number |
| name | string | Student name |
| email | string | Student email |
| department | string | Department name |
| year | string | Academic year |
| section | string | Section |
| batchId | string | Batch identifier |
| addedBy | string | Admin UID who added the student |
| createdAt | timestamp | Creation timestamp |

### `responses`

| Field | Type | Description |
|---|---|---|
| id | string | Document ID |
| formId | string | Associated form |
| institutionId | string | Associated institution |
| respondentType | string | `student` or `public` |
| respondentIdentifier | string | Roll number or email |
| respondentEmail | string | Respondent email address |
| answers | map | Field ID to answer value mapping |
| submittedAt | timestamp | Submission timestamp |

### `otpSessions`

| Field | Type | Description |
|---|---|---|
| id | string | Document ID |
| formId | string | Associated form |
| identifier | string | Roll number or email |
| email | string | Email the OTP was sent to |
| otpHash | string | bcrypt hash of the 6-digit OTP |
| attempts | number | Number of verification attempts |
| verified | boolean | Whether the OTP has been verified |
| expiresAt | timestamp | Expiration time (10 minutes from creation) |
| createdAt | timestamp | Creation timestamp |

---

## API Reference

All API routes live under `/api/`. Routes marked with "Auth" require a valid session cookie. Routes marked with "Super" require `super_admin` role.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Exchange a Firebase ID token for an httpOnly session cookie |
| POST | `/api/auth/logout` | Yes | Clear the session cookie |
| GET | `/api/auth/session` | Yes | Return the current admin profile from the session |

### Institutions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/institutions` | Super | List all institutions |
| POST | `/api/institutions` | Super | Create a new institution |
| GET | `/api/institutions/[id]` | Super | Get institution details |
| PUT | `/api/institutions/[id]` | Super | Update an institution |
| DELETE | `/api/institutions/[id]` | Super | Delete an institution |

### Admins

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admins` | Super | List all admin accounts |
| POST | `/api/admins` | Super | Create a new admin account |
| GET | `/api/admins/[uid]` | Super | Get admin details |
| PUT | `/api/admins/[uid]` | Super | Update an admin account |
| DELETE | `/api/admins/[uid]` | Super | Delete an admin account |

### Forms

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/forms` | Yes | List forms (scoped by institution for institution_admin) |
| POST | `/api/forms` | Yes | Create a new form |
| GET | `/api/forms/[formId]` | Yes | Get form details with fields |
| PUT | `/api/forms/[formId]` | Yes | Update form metadata or settings |
| DELETE | `/api/forms/[formId]` | Yes | Delete a form and its fields/responses |
| PUT | `/api/forms/[formId]/fields` | Yes | Save or replace all form fields |
| POST | `/api/forms/[formId]/publish` | Yes | Publish a draft form (generates slug) |
| GET | `/api/forms/[formId]/responses` | Yes | Get all responses with analytics data |
| POST | `/api/forms/[formId]/duplicate` | Yes | Duplicate a form with all its fields |
| GET | `/api/forms/[formId]/non-responders` | Yes | List eligible students who have not responded |

### Public Form Access

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/forms/public/[slug]` | No | Get a published form by its public slug |

### Students

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/students` | Yes | List students (with filtering and pagination) |
| POST | `/api/students` | Yes | Add student(s) individually or via CSV bulk upload |
| DELETE | `/api/students` | Yes | Bulk delete students by ID list |
| GET | `/api/students/[id]` | Yes | Get student details |
| PUT | `/api/students/[id]` | Yes | Update a student record |
| DELETE | `/api/students/[id]` | Yes | Delete a student record |
| GET | `/api/students/sections` | Yes | Get distinct sections, years, and departments |

### OTP and Submission

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/otp/send` | No | Send a 6-digit OTP to an email address |
| POST | `/api/otp/verify` | No | Verify an OTP code |
| POST | `/api/submit/[formId]` | No | Submit a form response (requires verified OTP session) |

### Admin Utilities

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/clear-data` | Super | Clear database data (responses, OTP sessions, students, or full reset) |

---

## Features

### Form Builder

The drag-and-drop form builder supports 17 field types:

| Field Type | Description |
|---|---|
| text | Single-line text input |
| textarea | Multi-line text input |
| number | Numeric input |
| email | Email address input |
| phone | Phone number input |
| dropdown | Single-select dropdown |
| radio | Single-select radio buttons |
| checkbox | Multi-select checkboxes |
| date | Date picker |
| time | Time picker |
| file | File upload |
| url | URL input |
| rating | Star rating |
| linear_scale | Numeric scale (e.g. 1-5, 1-10) |
| multiple_choice_grid | Grid with radio buttons per row |
| checkbox_grid | Grid with checkboxes per row |
| section_break | Visual separator between form sections |

Fields support per-field validation rules, required/optional toggles, help text, and reordering via drag-and-drop.

### Access Control

- **Restricted**: Only students enrolled in the form's institution can respond. Verified by roll number and OTP sent to their registered email.
- **Public**: Anyone with a valid email address can respond. OTP is sent to the provided email.

### Form Restrictions

Forms can be further restricted to specific subsets of students:

- Filter by **section**, **year**, or **department**.
- Upload a **target audience CSV** to restrict to specific students by email.

### OTP Verification

- 6-digit numeric OTP sent via Brevo email API.
- OTP is bcrypt-hashed before storage (never stored in plaintext).
- 10-minute expiry window.
- Rate limited: maximum 3 OTP requests per identifier per 15-minute window.
- Duplicate submission prevention: one response per verified identity per form.

### Response Analytics

- Bar charts, pie charts, and line charts for each question.
- Demographic breakdowns (by department, year, section).
- Response timeline visualization.
- Export responses as CSV.

### Non-Responders Tracking

- View which eligible students have not yet submitted a response.
- Export the non-responders list for follow-up.

### Student Management

- Add students individually through a form.
- Bulk import via CSV upload with validation and error reporting.
- Edit and delete student records.
- Bulk delete with multi-select.

### Multi-Institution Data Isolation

- All queries are scoped by `institutionId`.
- Institution admins can only access their own institution's data.
- Super admins have cross-institution visibility.

### Database Management

- Super admins can selectively clear: responses, OTP sessions, students, or perform a full data reset.

### Session Management

- 7-day httpOnly secure session cookies.
- Session-cookie-first authentication context on the client.
- Automatic redirect to login on session expiry.

---

## User Roles

### super_admin

- Full access to all institutions, admins, forms, students, and responses.
- Can create and manage institutions and admin accounts.
- Can clear database data.
- Not scoped to any single institution.

### institution_admin

- Scoped to a single institution.
- Can create and manage forms for their institution.
- Can add, edit, and delete students in their institution.
- Can view responses and analytics for their institution's forms.
- Cannot access other institutions' data or manage platform-level settings.

---

## Project Structure

```
EduForms/
├── scripts/
│   └── seed-admin.ts              # Seed initial super admin account
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx     # Login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── dashboard/page.tsx # Overview with stats and charts
│   │   │   ├── institutions/      # Institution management (super_admin)
│   │   │   ├── admins/            # Admin management (super_admin)
│   │   │   ├── forms/             # Form list, builder, and responses
│   │   │   ├── students/          # Student management
│   │   │   └── settings/          # Account settings
│   │   ├── api/
│   │   │   ├── auth/              # Login, logout, session endpoints
│   │   │   ├── institutions/      # Institution CRUD
│   │   │   ├── admins/            # Admin CRUD
│   │   │   ├── forms/             # Form CRUD, fields, publish, responses, duplicate, non-responders
│   │   │   │   └── public/        # Public form access by slug
│   │   │   ├── students/          # Student CRUD, sections metadata
│   │   │   ├── otp/               # Send and verify OTP
│   │   │   ├── submit/            # Form response submission
│   │   │   └── admin/             # Admin utilities (clear data)
│   │   ├── f/[slug]/page.tsx      # Public form submission page
│   │   ├── page.tsx               # Landing page
│   │   ├── not-found.tsx          # 404 page
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # Navigation sidebar
│   │   │   ├── topbar.tsx         # Top navigation bar
│   │   │   └── dashboard-shell.tsx # Dashboard wrapper
│   │   └── ui/                    # shadcn/ui components (button, card, dialog, etc.)
│   ├── context/
│   │   └── auth-context.tsx       # Authentication context provider
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts          # Firebase client SDK initialization
│   │   │   ├── admin.ts           # Firebase Admin SDK initialization
│   │   │   └── auth.ts            # Auth helper functions
│   │   ├── brevo/
│   │   │   └── email.ts           # Brevo email sending service
│   │   ├── utils/
│   │   │   ├── validation.ts      # Input validation utilities
│   │   │   ├── otp.ts             # OTP generation and hashing
│   │   │   ├── slug.ts            # Slug generation for form URLs
│   │   │   └── fetch.ts           # Safe fetch wrapper
│   │   └── utils.ts               # General utility functions (cn, etc.)
│   └── types/
│       └── index.ts               # TypeScript interfaces and types
├── middleware.ts                   # Next.js middleware (auth redirects)
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
└── components.json                # shadcn/ui configuration
```

---

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub.

2. Import the project in [Vercel](https://vercel.com).

3. Set all environment variables listed above in the Vercel dashboard under **Settings > Environment Variables**.

4. Deploy. Vercel will automatically detect the Next.js framework.

### Build command

```bash
npm run build
```

This runs `next build --webpack` as configured in `package.json`.

### Production start

```bash
npm run start
```

### Notes

- The `FIREBASE_SERVICE_ACCOUNT` environment variable must contain the full service account JSON as a single-line string. Escape newlines in the private key if necessary.
- Brevo API keys can be comma-separated for automatic rotation across multiple keys.
- Ensure your Firebase project has Firestore rules configured appropriately for production use, since the application accesses Firestore exclusively through server-side Admin SDK calls.

---

## License

MIT
