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
// Also set up symlink for @prisma/client to find the generated client
try {
  if (fs.existsSync(prismaClientPath)) {
    // Create default.js that properly re-exports the client
    // Prisma 7 generates TypeScript, so we need to let the bundler handle it
    fs.writeFileSync(defaultJsPath, `export * from './client.ts';\n`);
    fs.writeFileSync(defaultDtsPath, `export * from './client';\n`);
    
    // Set up symlink so @prisma/client can find the generated client
    const prismaClientPackagePath = path.join(projectRoot, 'node_modules', '@prisma', 'client');
    const prismaSymlinkPath = path.join(prismaClientPackagePath, '.prisma');
    const prismaSymlinkTarget = path.join(prismaSymlinkPath, 'client');
    
    if (fs.existsSync(prismaClientPackagePath)) {
      if (!fs.existsSync(prismaSymlinkPath)) {
        fs.mkdirSync(prismaSymlinkPath, { recursive: true });
      }
      // Remove existing symlink if it exists
      if (fs.existsSync(prismaSymlinkTarget)) {
        fs.unlinkSync(prismaSymlinkTarget);
      }
      // Create symlink
      fs.symlinkSync(path.relative(prismaSymlinkPath, prismaClientPath), prismaSymlinkTarget, 'dir');
    }
    
    console.log('✅ Created Prisma default.js and default.d.ts files');
    console.log('✅ Set up @prisma/client symlink');
  } else {
    console.log('⚠️  Prisma client not found, skipping postinstall step');
  }
} catch (error) {
  console.warn('⚠️  Postinstall script warning:', error.message);
  // Don't fail the install if this script has issues
  process.exit(0);
}
