# Quick Start Guide

Get your Shopify Section Generator up and running in 5 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Clerk account created
- [ ] Stripe account created
- [ ] PostgreSQL database (or Supabase account)

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

## Step 2: Set Up Environment Variables (3 minutes)

1. Copy `.env.example` to `.env.local`
2. Get your Clerk keys from [clerk.com](https://clerk.com)
3. Get your Stripe keys from [stripe.com](https://stripe.com)
4. Set up a database and get connection string

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

## Step 3: Set Up Database (5 minutes)

1. Create a PostgreSQL database
2. Run the SQL schema from `lib/db.ts` in your database
3. Verify tables are created

## Step 4: Add Section Templates (2 minutes)

1. Add JSON files to `/section-library` directory
2. See `section-library/hero-banner.json` for example format
3. Templates are automatically loaded

## Step 5: Run Development Server (1 minute)

```bash
npm run dev
```

Visit http://localhost:3000

## Step 6: Test the Application

1. **Sign Up**: Create a new account
2. **Generate Section**: Go to Generator page
3. **Test Free Limit**: Generate 5 sections (free plan limit)
4. **Upgrade**: Test Stripe checkout (use test mode)

## Common Issues

### "Templates not loading"
- Check `/section-library` directory exists
- Verify JSON files are valid
- Check file permissions

### "Database connection error"
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure schema is created

### "Stripe checkout not working"
- Verify Stripe keys are correct
- Check Price ID is set
- Ensure webhook is configured

## Next Steps

- [ ] Read full [README.md](README.md)
- [ ] Set up production deployment ([DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] Push to GitHub ([GITHUB_SETUP.md](GITHUB_SETUP.md))
- [ ] Configure production environment variables
- [ ] Set up Stripe webhooks for production

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- See `section-library/README.md` for template format

---

**Ready to deploy?** Follow the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

