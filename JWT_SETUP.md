# JWT Authentication Setup Guide

This guide explains how JWT (JSON Web Tokens) is connected and configured in your application.

## Overview

Your application uses JWT for authentication. Here's how it works:

1. **User Login/Register** → JWT token is generated
2. **Token stored in HTTP-only cookie** → Secure client-side storage
3. **Middleware validates token** → Protects routes automatically
4. **API routes verify token** → Access user information

## Current Implementation

JWT is already fully implemented in your codebase:

- ✅ `lib/auth.ts` - JWT token generation and verification
- ✅ `app/api/auth/login/route.ts` - Login with JWT
- ✅ `app/api/auth/register/route.ts` - Registration with JWT
- ✅ `middleware.ts` - Route protection using JWT
- ✅ `lib/middleware.ts` - API route authentication helpers

## Setup Steps

### 1. Generate JWT Secret

You need a strong, random secret key for signing JWT tokens. Generate one using:

```bash
# Option 1: Using OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Create `.env` File

Create a `.env` file in the `standalone-app` directory:

```bash
cd standalone-app
touch .env
```

### 3. Add JWT Configuration

Add the following to your `.env` file:

```env
# JWT Configuration
JWT_SECRET="your-generated-secret-key-here"

# Other required variables
DATABASE_URL="postgresql://user:password@localhost:5432/vibecoder?schema=public"
OPENAI_API_KEY="sk-your-openai-api-key-here"
NODE_ENV="development"
```

**⚠️ Important:** 
- Replace `your-generated-secret-key-here` with the secret you generated in step 1
- Never commit the `.env` file to version control
- Use different secrets for development and production

### 4. Verify Installation

Check that `jsonwebtoken` is installed:

```bash
npm list jsonwebtoken
```

If not installed, run:

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

## How JWT Works in Your App

### Token Generation

When a user logs in or registers, a JWT token is created:

```typescript
// lib/auth.ts
const token = generateToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});
```

The token contains:
- `userId` - User's unique ID
- `email` - User's email address
- `role` - User's role (user/admin)
- `exp` - Expiration time (7 days)

### Token Storage

The token is stored in an HTTP-only cookie:

```typescript
// lib/auth.ts
cookieStore.set('auth-token', token, {
  httpOnly: true,        // Prevents JavaScript access
  secure: true,          // HTTPS only in production
  sameSite: 'lax',       // CSRF protection
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

### Route Protection

The middleware automatically protects routes:

```typescript
// middleware.ts
const token = request.cookies.get('auth-token')?.value;

if (!token && !isPublicRoute) {
  return NextResponse.redirect('/login');
}
```

### API Route Authentication

Protected API routes use the `requireAuth` helper:

```typescript
// app/api/auth/me/route.ts
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User is authenticated, proceed...
}
```

## Testing JWT Connection

### 1. Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### 2. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### 3. Test Protected Route

```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

You should receive user information if the JWT is valid.

## Troubleshooting

### Issue: "Invalid token" errors

**Solution:** 
- Check that `JWT_SECRET` is set in `.env`
- Restart your development server after adding `.env`
- Ensure the secret hasn't changed (tokens signed with old secret won't verify)

### Issue: Token expires too quickly

**Solution:** 
Modify `JWT_EXPIRES_IN` in `lib/auth.ts`:

```typescript
const JWT_EXPIRES_IN = '30d'; // Change from '7d' to '30d'
```

### Issue: Cookie not being set

**Solution:**
- Check browser console for cookie errors
- Ensure you're using HTTPS in production (or set `secure: false` for development)
- Verify `sameSite` settings match your domain setup

### Issue: Middleware not protecting routes

**Solution:**
- Check `middleware.ts` configuration
- Verify the route matches the `matcher` pattern
- Ensure middleware is in the root directory, not in `app/`

## Security Best Practices

1. **Strong Secret**: Use a long, random string (at least 32 characters)
2. **Environment Variables**: Never hardcode secrets in code
3. **HTTPS in Production**: Always use HTTPS to protect tokens in transit
4. **Token Expiration**: Set reasonable expiration times (7 days is good)
5. **HttpOnly Cookies**: Prevents XSS attacks (already implemented)
6. **SameSite**: Prevents CSRF attacks (already implemented)

## Production Deployment

When deploying to production:

1. **Generate a new secret** for production (don't reuse dev secret)
2. **Set environment variables** in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Railway: Variables tab
3. **Verify HTTPS** is enabled (required for secure cookies)
4. **Test authentication** after deployment

## Additional Resources

- [JWT.io](https://jwt.io) - JWT debugger and documentation
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)

## Quick Checklist

- [ ] Generated JWT_SECRET using `openssl rand -base64 32`
- [ ] Created `.env` file in `standalone-app/` directory
- [ ] Added `JWT_SECRET` to `.env` file
- [ ] Added `.env` to `.gitignore`
- [ ] Restarted development server
- [ ] Tested registration endpoint
- [ ] Tested login endpoint
- [ ] Tested protected route (`/api/auth/me`)

---

Your JWT authentication is ready to use! 🎉

