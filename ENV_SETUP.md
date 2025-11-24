# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vibecoder?schema=public"

# JWT Secret (generate a strong random string)
# You can generate one using: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# OpenAI API Key
# Get yours from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Node Environment
NODE_ENV="development"
```

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key and paste it in your `.env` file

## Database Setup

### Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE vibecoder;
   ```
3. Update `DATABASE_URL` with your credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/vibecoder?schema=public"
   ```

### Cloud Database (Recommended for Production)

- **Supabase**: Free PostgreSQL hosting
- **Railway**: Easy PostgreSQL setup
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Enterprise solution

## Security Notes

- **Never commit your `.env` file** to version control
- Use strong, random strings for `JWT_SECRET` in production
- Rotate API keys regularly
- Use environment-specific values for production

