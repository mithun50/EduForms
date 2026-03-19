# EduForms

A form management platform for educational institutions built with Next.js 16, Firebase, and Tailwind CSS. Supports OTP-verified form submissions, multi-institution management, and role-based access control.

## Features

- **Multi-Institution Support** — Super admins manage multiple institutions, each with their own admins and students
- **Role-Based Access** — Super admin (global access) and Institution admin (scoped to their institution)
- **Form Builder** — Drag-and-drop field ordering with 12 field types: text, textarea, number, email, phone, dropdown, radio, checkbox, date, file upload, rating, linear scale
- **OTP Verification** — Email-based OTP for form submissions (restricted to enrolled students or open to public)
- **CSV Bulk Upload** — Import students via CSV with validation and error reporting
- **Response Analytics** — Bar charts, pie charts, and response timeline visualizations
- **Responsive UI** — Adaptive layouts from 360px phones to 1920px+ desktops with mobile card views and desktop tables

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth + server-side session cookies
- **Email**: Brevo (Sendinblue) for OTP delivery
- **UI**: Tailwind CSS + shadcn/ui (Base UI)
- **Charts**: Recharts
- **Validation**: Zod

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard pages
│   │   ├── dashboard/         # Stats overview
│   │   ├── institutions/      # Institution management (super_admin)
│   │   ├── admins/            # Admin management (super_admin)
│   │   ├── forms/             # Form list, builder, responses
│   │   ├── students/          # Student management with institution selector
│   │   └── settings/          # Account info
│   ├── api/                   # API routes
│   └── f/[slug]/              # Public form submission page
├── components/
│   ├── layout/                # Dashboard shell, sidebar, topbar
│   └── ui/                    # shadcn/ui components
├── context/                   # Auth context provider
├── lib/
│   ├── firebase/              # Firebase client + admin SDK
│   ├── brevo/                 # Email service
│   └── utils/                 # Validation, OTP, slug, safe fetch
└── types/                     # TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- Brevo account for email delivery

### Environment Variables

Create `.env.local`:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_FROM_NAME=EduForms
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npx next build --webpack
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Create session from Firebase ID token |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/session` | GET | Get current admin from session |
| `/api/institutions` | GET/POST | List/create institutions |
| `/api/admins` | GET/POST | List/create admin accounts |
| `/api/forms` | GET/POST | List/create forms |
| `/api/forms/[id]` | GET | Get form with fields |
| `/api/forms/[id]/fields` | PUT | Save form fields |
| `/api/forms/[id]/publish` | POST | Publish a draft form |
| `/api/forms/[id]/responses` | GET | Get form responses |
| `/api/students` | GET/POST | List/create students (single or CSV bulk) |
| `/api/otp/send` | POST | Send OTP to student/public email |
| `/api/otp/verify` | POST | Verify OTP code |
| `/api/submit/[formId]` | POST | Submit form response |

## License

MIT
