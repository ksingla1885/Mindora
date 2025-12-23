# Mindora - Online Test Platform

Mindora is a comprehensive online testing platform built with Next.js, featuring secure test administration, real-time test taking, and payment processing.

## Features

- 🚀 **Test Administration** - Create and manage tests with various question types
- ⚡ **Real-time Testing** - Live test-taking experience with auto-saving
- 💳 **Secure Payments** - Integrated Razorpay payment gateway
- 📊 **Analytics** - Detailed performance analysis and reporting
- 🔒 **Secure** - Role-based access control and data protection

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Razorpay account (for payment processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mindora.git
   cd mindora
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Update the environment variables in .env.local
   ```

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing Payment Integration

To test the payment integration, follow these steps:

1. Visit the test payment page: [http://localhost:3000/test-payment](http://localhost:3000/test-payment)
2. Enter a test ID (any string)
3. Enter an amount in paise (e.g., 1000 for ₹10.00)
4. Click "Test Payment"

### Test Card Details

Use the following test card details for payment:

- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mindora?schema=public"

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_ENV=test  # Change to 'production' in production

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
```

## Scripts

- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `lint` - Run ESLint
- `prisma:generate` - Generate Prisma client
- `prisma:migrate` - Run database migrations
- `prisma:studio` - Open Prisma Studio

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Razorpay
- **Deployment**: Vercel

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
