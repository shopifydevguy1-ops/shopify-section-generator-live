#!/bin/bash

# Database Setup Script for Z.com
# Run this script via SSH after your app is deployed

echo "🚀 Starting database setup..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it in your z.com environment variables"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Navigate to app directory (adjust path if needed)
cd "$(dirname "$0")" || exit

echo "📦 Pushing database schema..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Error: Failed to push database schema"
    exit 1
fi

echo ""
echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully!"
else
    echo "⚠️  Warning: Database seeding failed (this is optional)"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Your database is now ready to use."
echo "You can test it by visiting your app and registering a new account."

