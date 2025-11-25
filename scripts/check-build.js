const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !fs.existsSync(nextDir)) {
  console.log('⚠️  Next.js build not found. Building now...');
  console.log('⚠️  This may take a few minutes...');
  const { execSync } = require('child_process');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} else if (!fs.existsSync(nextDir)) {
  console.log('ℹ️  Running in development mode - build not required');
}

