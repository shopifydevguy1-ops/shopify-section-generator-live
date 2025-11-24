# VibeCoder AI - Section Generator

A full-stack Next.js application for AI-powered section generation with user authentication, subscription management, and admin panel.

## Features

- 🔐 **Authentication System**: JWT-based auth with login, register, and protected routes
- 💳 **Subscription System**: Free tier (5 generations) and Pro tier (unlimited)
- 🎨 **Section Generator**: AI-powered section generation using OpenAI
- 📚 **Section Library**: Browse and use pre-built section templates
- 👥 **Admin Panel**: Manage users, sections, and view generation logs
- 🌓 **Dark/Light Mode**: Full theme support with glassmorphism UI
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt password hashing
- **AI**: OpenAI API (GPT-4 Turbo)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   cd standalone-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A strong random string for JWT signing
   - `OPENAI_API_KEY`: Your OpenAI API key

4. **Set up the database**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

### Using PostgreSQL

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE vibecoder;
   ```

2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/vibecoder?schema=public"
   ```

3. Run migrations:
   ```bash
   npm run db:push
   ```

4. Seed initial sections:
   ```bash
   npm run db:seed
   ```

## Project Structure

```
standalone-app/
├── app/
│   ├── (protected)/          # Protected routes with auth
│   │   ├── dashboard/        # User dashboard
│   │   ├── generator/        # Section generator
│   │   ├── library/          # Section library
│   │   ├── settings/         # Account settings
│   │   └── admin/            # Admin panel
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── sections/         # Section endpoints
│   │   ├── generate/         # Generation endpoint
│   │   └── admin/             # Admin endpoints
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   └── layout.tsx            # Root layout
├── components/                # React components
│   ├── sidebar.tsx           # Navigation sidebar
│   ├── modal.tsx             # Modal component
│   ├── upgrade-modal.tsx     # Upgrade prompt
│   └── theme-provider.tsx    # Theme context
├── lib/                      # Utility functions
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # Auth utilities
│   ├── middleware.ts         # Route protection
│   ├── subscription.ts       # Subscription logic
│   └── openai.ts             # OpenAI integration
└── prisma/
    ├── schema.prisma          # Database schema
    └── seed.ts                # Seed data
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Sections
- `GET /api/sections` - List sections (with search/tag filters)
- `GET /api/sections/[id]` - Get section by ID

### Generation
- `POST /api/generate` - Generate section code

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users` - Update user
- `GET /api/admin/sections` - List all sections
- `POST /api/admin/sections` - Create section
- `PUT /api/admin/sections/[id]` - Update section
- `DELETE /api/admin/sections/[id]` - Delete section
- `GET /api/admin/logs` - View generation logs

## Usage

### Creating an Account

1. Navigate to `/register`
2. Enter your email and password
3. You'll be automatically logged in and redirected to the dashboard

### Generating Sections

1. Go to **Section Generator**
2. Enter a prompt describing the section you want
3. Optionally select a template from the library
4. Click **Generate Section**
5. Copy or download the generated code

### Free Tier Limitations

- Free users can generate up to 5 sections total
- Free users can only use sections tagged with "free"
- Pro users have unlimited access to all features

### Admin Panel

To create an admin user, update the database directly:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Deployment

⚠️ **Important:** This app **cannot be deployed to GitHub Pages** because it requires Node.js, a database, and API routes. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

**Vercel (Recommended):**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables
4. Deploy!

**Netlify:**
1. Go to [netlify.com](https://netlify.com)
2. Import from GitHub
3. Configure build: `npm run build`
4. Add environment variables
5. Deploy!

**Railway:**
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Add PostgreSQL database
4. Add environment variables
5. Auto-deploys!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide with all options.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
