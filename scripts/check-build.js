const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const nextDir = path.join(process.cwd(), '.next');
const buildManifest = path.join(nextDir, 'BUILD_ID');
const isProduction = process.env.NODE_ENV === 'production';

console.log('🔍 Checking for Next.js build...');
console.log('   Current directory:', process.cwd());
console.log('   Looking for .next in:', nextDir);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');

// Check if build exists and is valid
const buildExists = fs.existsSync(nextDir) && fs.existsSync(buildManifest);

if (isProduction && !buildExists) {
  console.log('');
  console.log('⚠️  Next.js production build not found!');
  console.log('⚠️  Building now... (this may take a few minutes)');
  console.log('');
  
  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    // Verify build was created
    if (fs.existsSync(nextDir) && fs.existsSync(buildManifest)) {
      console.log('');
      console.log('✅ Build complete and verified!');
    } else {
      console.error('');
      console.error('❌ Build completed but .next directory not found!');
      console.error('   This may indicate a build error.');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Build failed!');
    console.error('   Error:', error.message);
    if (error.stdout) console.error('   Output:', error.stdout.toString());
    if (error.stderr) console.error('   Errors:', error.stderr.toString());
    process.exit(1);
  }
} else if (buildExists) {
  console.log('✅ Next.js build found!');
} else if (!isProduction) {
  console.log('ℹ️  Running in development mode - build not required');
} else {
  console.log('⚠️  Build check completed');
}

