# Quick Start Guide

Get your VibeCoder AI app running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd standalone-app
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - A random string (use `openssl rand -base64 32`)
- `OPENAI_API_KEY` - Your OpenAI API key

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions.

## Step 3: Set Up Database

```bash
# Create database (if using local PostgreSQL)
createdb vibecoder

# Push schema
npm run db:push

# Seed initial data
npm run db:seed
```

## Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Create Your First Account

1. Go to `/register`
2. Create an account
3. Start generating sections!

## Creating an Admin User

To access the admin panel, update a user's role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Or use Prisma Studio:

```bash
npm run db:studio
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out the API endpoints in the README
- Customize sections in the admin panel
- Deploy to production!

## Troubleshooting

**Database connection error?**
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify database exists

**OpenAI API errors?**
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Ensure the key has proper permissions

**Build errors?**
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check Node.js version (requires 18+)

## Need Help?

Check the main [README.md](./README.md) for comprehensive documentation.

