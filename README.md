# 🚀 Mindora — Online Olympiad & Test Preparation Platform

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-6.18.0-blue?logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-38bdf8?logo=tailwind-css)](https://tailwindcss.com)

**Mindora** is a state-of-the-art, comprehensive online testing and preparation platform built for national and international student Olympiads (e.g., NSO, IMO, IEO). It features robust secure test administration, proctored mock exams, a customizable Daily Practice Problem (DPP) engine with streak tracking, AI-assisted tutoring, and integrated payment processing.

---

## 📖 Table of Contents
1. [Features](#-features)
2. [Architecture Overview](#-architecture-overview)
3. [Technology Stack](#-technology-stack)
4. [Directory Structure](#-directory-structure)
5. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Database Setup & Seeding](#database-setup--seeding)
6. [Running Locally](#-running-locally)
7. [Authentication & Security](#-authentication--security)
8. [API Overview](#-api-overview)
9. [Testing Payment Integration](#-testing-payment-integration)
10. [Testing Suite](#-testing-suite)
11. [Deployment Guide](#-deployment-guide)
12. [Development Workflow](#-development-workflow)
13. [Troubleshooting](#-troubleshooting)
14. [Contributing](#-contributing)
15. [Roadmap](#-roadmap)
16. [License](#-license)

---

## ✨ Features

- 📝 **Advanced Question Bank & Formats**: Support for Multiple Choice (MCQ), True/False, and Subjective (Short/Long Answer) questions categorized by subject, topic, and difficulty.
- ⚡ **Real-Time Test-Taking Engine**: Smooth, edge-optimized exam client with client-side timer synchronization, background progress auto-saving (via Redis), and auto-grading.
- 🛡️ **Anti-Cheat & Proctoring Hook**: Browser focus tracking, full-screen enforcement, and tab-switch monitoring to ensure exam integrity.
- 📅 **Daily Practice Problems (DPP)**: Personalized daily workouts based on user configuration, complete with XP progression and streaks.
- 💳 **Razorpay Checkout Integration**: Secure checkout processing with webhook listeners, order status persistence, and fallback mock modes for testing.
- 📊 **Analytics & Reports**: Visual charts highlighting weaknesses, performance over time, average completion time, and downloadable PDF reports (jsPDF integration).
- 🏆 **Gamified Leaderboards & Certificates**: Ranks computed based on best scores, XP achievements, streaks, and PDF certificate generation.
- 🤖 **AI Study Assistant**: Question explanations, performance analyses, and tailored 3-day study plans using OpenAI GPT-4.
- ✉️ **Nodemailer Alerts**: Transporter setup for SMTP confirmation emails, test reports, and notifications.

---

## 🏛️ Architecture Overview

Mindora follows a modern, decoupled monolithic structure built on Next.js App Router:

- **Client Layer**: Server-rendered layouts and client components styled using Tailwind CSS v4. State is managed via React context providers and local hooks (e.g., proctoring, text-to-speech).
- **Service Layer**: Pure business services (`src/services`) separating data orchestration from route handlers.
- **Data Persistence**: Supabase PostgreSQL database managed via Prisma ORM for type-safe query building.
- **Fast Access & State Cache**: Upstash Redis (Serverless HTTP REST Client) used for real-time answer persistence, API rate-limiting, and AI explanation caching.
- **WebSocket Server**: Custom HTTP node wrapper (`server.js`) providing real-time room communication for proctoring notifications.

---

## 🛠️ Technology Stack

- **Core Framework**: Next.js v16.1.6 (App Router)
- **UI Runtime**: React v19.2.0
- **Database ORM**: Prisma Client v6.18.0 / CLI v6.19.0
- **Database Engine**: PostgreSQL (Supabase)
- **Cache / Storage**: Upstash Redis & AWS S3
- **Payment Processing**: Razorpay SDK v2.9.6
- **Real-time Server**: Socket.IO v4.8.1
- **Styling**: Tailwind CSS v4.2.2 + Radix UI Primitives
- **Testing**: Jest v30.2.0 + React Testing Library

---

## 📁 Directory Structure

```
├── .github/                   # CI/CD Workflows
├── lib/                       # Root level test utilities and video uploads
├── prisma/                    # Database models and seeders
│   ├── schema.prisma          # Prisma PostgreSQL schema
│   └── seed.js                # Core seed data (Maths, Chemistry, Physics)
├── scripts/                   # System maintenance and database tools
├── src/                       # Application source
│   ├── app/                   # App Router layout and pages
│   │   ├── (admin)/           # Admin dashboard and content control routes
│   │   ├── (auth)/            # Signin, registration, reset workflows
│   │   ├── (dashboard)/       # Student analytics, DPP, weekly tests
│   │   └── api/               # Serverless Next.js API endpoints
│   ├── components/            # Shared UI components (ui, editor, graphs)
│   ├── config/                # Platform configurations (Redis, AWS, S3)
│   ├── contexts/              # React Context (Auth, theme, providers)
│   ├── hooks/                 # Reusable utility hooks (proctoring, TTS)
│   ├── lib/                   # Integrations (s3, email, database, payment)
│   ├── services/              # Domain-specific services (dpp, websocket)
│   └── utils/                 # General helpers
├── server.js                  # Custom server integration (Next.js + Socket.IO)
└── socket-server.js           # Standalone development Socket.IO server
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js version 18 or higher (v20+ recommended)
- A PostgreSQL Database instance (local or hosted like Supabase)
- An Upstash Redis account (or a local Redis server running)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ksingla1885/Mindora.git
   cd Mindora
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

### Environment Variables
Create a `.env.local` file (or rename `.env.example`) in the root directory:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@mindora.com
ADMIN_PASSWORD=secure_admin_password

# Database (Supabase PostgreSQL Connection)
# Pooled (for Serverless) and Direct (for migrations)
DATABASE_URL="postgresql://postgres.[username]:[password]@aws-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[username]:[password]@aws-1.pooler.supabase.com:5432/postgres"

# Authentication (Auth.js / NextAuth)
NEXTAUTH_SECRET=your_openssl_generated_secret_key
AUTH_SECRET=your_openssl_generated_secret_key
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret

# payment gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Local Redis Caching (optional fallback)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3 Storage (for PDF & image uploads)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=mindora-content

# OpenAI API (For AI Tutoring)
OPENAI_API_KEY=sk-xxxxxxx

# SMTP Credentials (Emails)
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
```

### Database Setup & Seeding
Prepare and seed the database schemas with the following commands:
1. Generate the local Prisma Client:
   ```bash
   npx prisma generate
   ```
2. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Seed the database with subjects, topics, and initial question banks:
   ```bash
   npx prisma db seed
   ```

---

## 🏃 Running Locally

Start the Next.js development server:
```bash
npm run dev
```
To run the custom Socket.IO real-time server alongside Next.js in development:
```bash
npm run socket
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🔒 Authentication & Security

- **Multi-Role RBAC**: User roles are categorized into `STUDENT`, `TEACHER`, and `ADMIN`. Routes and operations are validated based on these roles in `src/middleware.js`.
- **OTP Verification**: Sign-ups require verifying an email OTP before the account is activated.
- **CSRF & Security Headers**: Custom headers (CSP, Frame Options, XSS block, Referral-Policy) are appended to all requests.
- **IP Rate Limiting**: Next.js middleware implements request rate limiting to defend against brute force and scraping.

---

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | User signup. Generates registration OTP. |
| `POST` | `/api/auth/verify-otp` | Validates registration OTP. |
| `POST` | `/api/payments` | Creates order payloads for Razorpay checks. |
| `PUT` | `/api/payments` | Verifies payments and unlocks content access. |
| `POST` | `/api/tests/[testId]/attempts` | Initiates an exam attempt. |
| `PATCH` | `/api/tests/[testId]/attempts/[attemptId]` | Auto-saves live question answers. |
| `POST` | `/api/tests/[testId]/attempts/[attemptId]/submit` | Submits and grades the exam. |
| `GET` | `/api/dpp/today` | Fetches personalized daily practice problems. |
| `POST` | `/api/ai/explain-question` | Fetches an AI breakdown of a specific question. |

---

## 💳 Testing Payment Integration

To simulate purchase flows without configuring live keys:
1. Ensure `RAZORPAY_KEY_ID` in `.env.local` is empty or matches a dummy pattern.
2. Navigate to [http://localhost:3000/test-payment](http://localhost:3000/test-payment).
3. The gateway will run in **Mock Mode**, displaying a custom test checkout modal.
4. Input fake test identifiers and check out. It will verify and unlock access instantly.

---

## 🧪 Testing Suite

Mindora includes a unit and integration testing suite utilizing Jest and MSW (Mock Service Worker):

- Run all tests:
  ```bash
  npm test
  ```
- Run tests in watch mode:
  ```bash
  npm run test:watch
  ```
- Generate test coverage reports:
  ```bash
  npm run test:coverage
  ```

---

## 🚢 Deployment Guide

Mindora is optimized for deployment on the **Vercel** platform:

1. **Deploy Repository**: Connect the repository to Vercel.
2. **Environment Variables**: Configure all parameters listed in the Environment Variables section on the Vercel dashboard.
3. **Database Connection Pooling**: Ensure `DATABASE_URL` connects via a transaction pooler (like PgBouncer port `6543`) to prevent Vercel Serverless Lambdas from exhausting PostgreSQL connections. Use `DIRECT_URL` for migration steps.
4. **WebSocket Setup**: Since Vercel Lambdas are stateless, set `NEXT_PUBLIC_WS_URL` to point to a standalone Socket.IO instance hosted on a service like Render, Heroku, or AWS ECS.

---

## 🛠️ Development Workflow

1. **Prisma Schema Changes**: Always execute `npx prisma generate` after modifying `prisma/schema.prisma`. Execute `npx prisma migrate dev` to generate a migration script for schema updates.
2. **Linting**: Ensure code conforms to syntax rules before committing:
   ```bash
   npm run lint
   ```

---

## 🔍 Troubleshooting

- **Prisma Client Generation Issue**: If you see missing module errors in code imports, run `npx prisma generate` to rebuild Prisma client types locally.
- **Redis Connection Failures**: If Upstash Redis times out, verify that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are valid. If working offline, configure `REDIS_HOST` to `localhost` and run a local Redis service.
- **NextAuth Mismatches**: If login redirects fail, verify that `NEXTAUTH_URL` matches the port (e.g., `http://localhost:3000`) you are hosting the app on.

---

## 🤝 Contributing

We welcome contributions to Mindora! Please ensure you adhere to the project standards:
- Open an issue discussing proposed changes before creating a pull request.
- Keep commits descriptive and follow standard naming conventions.
- Format files using Prettier and verify lint checks pass.

---

## 🗺️ Roadmap

- [ ] **Database Constraint Fix**: Remove the `TestAttempt` composite unique constraint to allow multiple student test attempts safely.
- [ ] **Leaderboard Ranks Repair**: Fix the field names (`testsTaken` -> `testCount`) inside the admin leaderboard API route.
- [ ] **Upstash Rate Limiting**: Move middleware rate-limiting states into Redis to support distributed serverless instances.
- [ ] **AI Recommendation Enhancements**: Feed real historical user performance data into the AI study plan prompt.
- [ ] **Interactive Proctoring Monitor**: Admin interface for viewing live proctoring violations and tabs switches in real-time.

---

## 📄 License

This project is licensed under the **AGPL-3.0 License**. See the [LICENSE](LICENSE) file for more information.
