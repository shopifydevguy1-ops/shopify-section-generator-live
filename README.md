# Shopify Section Generator

A full-featured web application for generating Shopify sections from pre-built templates. Built with Next.js 14, TypeScript, Tailwind CSS, Clerk Authentication, and Stripe payments.

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
- **Payments**: Stripe
- **Database**: PostgreSQL (via Supabase or custom setup)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Clerk account (for authentication)
- Stripe account (for payments)
- PostgreSQL database (or Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shopifydevguy1-ops/shopify-section-generator.git
   cd shopify-section-generator
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

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...

   # Database (PostgreSQL connection string)
   DATABASE_URL=postgresql://user:password@localhost:5432/shopify_section_generator

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
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

## Setting Up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Create a product and price for the Pro plan ($20/month)
4. Copy the Price ID to `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
5. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
6. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

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

5. **Stripe Webhooks**
   
   Update your Stripe webhook URL to point to your production domain:
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
- `subscriptions`: Stripe subscription records
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
- `GET /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
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

### Stripe webhooks not working
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure webhook events are configured in Stripe dashboard

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

