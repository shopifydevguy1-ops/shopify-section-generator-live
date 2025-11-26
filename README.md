# Shopify Section Generator

A full-featured web application for generating Shopify sections from pre-built templates. Built with Next.js 14, TypeScript, Tailwind CSS, Clerk Authentication, and PayMongo payments.

## Features

- 🎨 **Pre-built Templates**: Library of professionally designed Shopify section templates
- ⚡ **Instant Generation**: Generate sections in seconds with customizable variables
- 💳 **Subscription Plans**: Free (5 generations/month) and Pro ($20/month, unlimited)
- 🔐 **Secure Authentication**: Powered by Clerk
- 📥 **Download Support**: Download generated sections as .liquid files
- 🌙 **Dark Mode**: Built-in dark mode support
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **Authentication**: Clerk
- **Payments**: PayMongo (Philippines payment gateway)
- **Database**: PostgreSQL (via Supabase or custom setup)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Clerk account (for authentication)
- PayMongo account (for payments - free account available)
- PostgreSQL database (or Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shopifydevguy1-ops/shopify-section-generator-live.git
   cd shopify-section-generator-live
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # PayMongo
   PAYMONGO_SECRET_KEY=sk_test_...
   PAYMONGO_WEBHOOK_SECRET=whsec_...
   PAYMONGO_PRO_AMOUNT=2000

   # Database (PostgreSQL connection string)
   DATABASE_URL=postgresql://user:password@localhost:5432/shopify_section_generator

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Admin Emails (comma-separated list of emails that should have admin access)
   ADMIN_EMAILS=admin@example.com,owner@example.com
   ```

4. **Set up the database**
   
   Run the SQL schema from `lib/db.ts` in your PostgreSQL database:
   ```sql
   -- Copy the databaseSchema string from lib/db.ts and execute it
   ```

5. **Add section templates**
   
   Upload your section template JSON files to the `/section-library` directory. See `section-library/README.md` for the template format.

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setting Up Clerk

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key and secret key to `.env.local`
4. Configure sign-in/sign-up URLs in Clerk dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

## Setting Up PayMongo

1. Create a free account at [paymongo.com](https://www.paymongo.com)
2. Complete account activation and verification
3. Get your API keys from the PayMongo Dashboard → Developers → API Keys
4. Copy the Secret Key to `PAYMONGO_SECRET_KEY`
   - Use test keys (`sk_test_...`) for development
   - Use live keys (`sk_live_...`) for production
5. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `payment.paid`
     - `payment.failed`
     - `payment.refunded`
6. Copy the webhook signing secret to `PAYMONGO_WEBHOOK_SECRET`
7. Configure `PAYMONGO_PRO_AMOUNT` (amount in cents, e.g., 2000 = ₱20.00)

**Note:** PayMongo doesn't have native subscription support like Stripe. This implementation uses manual recurring billing. For true recurring subscriptions, you'll need to implement a cron job or scheduled task to create new checkout sessions monthly.

## Admin Dashboard

The app includes an admin dashboard for tracking users and subscribers.

### Setting Up Admin Access

1. **Add admin emails to environment variables:**
   ```env
   ADMIN_EMAILS=admin@example.com,owner@example.com
   ```
   Add comma-separated list of email addresses that should have admin access.

2. **Access the admin dashboard:**
   - Sign in with an admin email address
   - Navigate to `/admin` or click the "Admin" button in the navbar
   - View all users, subscriptions, and usage statistics

### Admin Features

- **User Management**: View all registered users with their plans and subscription status
- **Usage Tracking**: Monitor section generation activity
- **Statistics Dashboard**: See total users, subscriptions, and generation counts
- **Recent Activity**: View latest user registrations and section generations

## Section Library

### Adding Templates

1. Create a JSON file in `/section-library` directory
2. Follow the template structure (see `section-library/README.md`)
3. Use `{{variable_name}}` placeholders in your Liquid code
4. Define all variables in the `variables` object

### Template Structure

```json
{
  "id": "unique-id",
  "name": "Template Name",
  "description": "Description",
  "tags": ["tag1", "tag2"],
  "type": "hero",
  "liquid_code": "Liquid code with {{variables}}",
  "variables": {
    "variable_name": {
      "type": "text|textarea|color",
      "default": "default value",
      "label": "Display Label",
      "description": "Optional description"
    }
  }
}
```

## Deployment to Z.com

### Build for Production

1. **Build the application**
   ```bash
   npm run build
   ```
   
   This creates a static export in the `/out` directory.

2. **Upload to Z.com**
   
   - Connect your GitHub repository to Z.com
   - Or manually upload the `/out` directory contents to your hosting
   - Ensure your domain is configured

3. **Environment Variables**
   
   Set all environment variables in your Z.com hosting control panel or via their environment variable settings.

4. **Database Setup**
   
   - Set up a PostgreSQL database (Z.com may offer this, or use a service like Supabase)
   - Run the database schema from `lib/db.ts`
   - Update `DATABASE_URL` in your environment variables

5. **PayMongo Webhooks**
   
   Update your PayMongo webhook URL to point to your production domain:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```

### Static Export Notes

The app is configured for static export (`output: 'export'` in `next.config.js`). This means:
- API routes won't work in static hosting
- You'll need to use a serverless function service for API routes, OR
- Modify the app to use client-side API calls to an external backend

**For Z.com PHP hosting**, you may need to:
1. Set up a separate API server (e.g., Vercel, Railway, or a VPS)
2. Point API calls to that server
3. Or use Z.com's serverless functions if available

## Database Schema

The application requires the following tables:

- `users`: User accounts (extends Clerk user data)
- `subscriptions`: PayMongo payment/subscription records
- `usage_logs`: Section generation usage tracking
- `section_templates`: Optional database storage for templates (can also use JSON files)

See `lib/db.ts` for the complete schema.

## Usage Limits

- **Free Plan**: 5 section generations per month
- **Pro Plan**: Unlimited generations

Usage resets at the beginning of each billing period.

## API Routes

- `GET /api/templates` - Get all section templates
- `POST /api/generate` - Generate a section (requires auth)
- `GET /api/checkout` - Create PayMongo checkout session
- `POST /api/webhooks/stripe` - Handle PayMongo webhooks
- `POST /api/cancel-subscription` - Cancel subscription

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard page
│   ├── generator/        # Section generator page
│   ├── account/          # Account settings page
│   ├── pricing/          # Pricing page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # ShadCN UI components
│   └── navbar.tsx        # Navigation component
├── lib/
│   ├── db.ts             # Database utilities
│   ├── section-generator.ts  # Section generation logic
│   └── utils.ts          # Utility functions
├── section-library/      # Section template JSON files
├── hooks/                # React hooks
└── middleware.ts         # Clerk middleware
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Templates not loading
- Ensure JSON files are in `/section-library` directory
- Check JSON syntax is valid
- Verify template structure matches the expected format

### PayMongo webhooks not working
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure webhook events are configured in PayMongo dashboard
- Verify webhook signature verification is working

### Database connection issues
- Verify `DATABASE_URL` is correct
- Ensure database schema is created
- Check database server is accessible

## License

This project is proprietary. All rights reserved.

## Support

For issues and questions, please open an issue on GitHub or contact support.

---

**Note**: This application uses static export for deployment. API routes require a serverless function service or separate backend for production use with static hosting like Z.com.

