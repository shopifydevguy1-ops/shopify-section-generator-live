const fs = require('fs');
const path = require('path');

// Get the directory where this script is located
const scriptDir = __dirname;
// Get the project root (parent of scripts directory)
const projectRoot = path.resolve(scriptDir, '..');
const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma', 'client');
const defaultJsPath = path.join(prismaClientPath, 'default.js');
const defaultDtsPath = path.join(prismaClientPath, 'default.d.ts');

// Create default.js that re-exports from client
try {
  if (fs.existsSync(prismaClientPath)) {
    fs.writeFileSync(defaultJsPath, `module.exports = require('./client');\n`);
    fs.writeFileSync(defaultDtsPath, `export * from './client';\n`);
    console.log('✅ Created Prisma default.js and default.d.ts files');
  } else {
    console.log('⚠️  Prisma client not found, skipping postinstall step');
  }
} catch (error) {
  console.warn('⚠️  Postinstall script warning:', error.message);
  // Don't fail the install if this script has issues
  process.exit(0);
}
