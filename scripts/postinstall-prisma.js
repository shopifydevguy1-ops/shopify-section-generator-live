const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(__dirname, '../node_modules/.prisma/client');
const defaultJsPath = path.join(prismaClientPath, 'default.js');
const defaultDtsPath = path.join(prismaClientPath, 'default.d.ts');

// Create default.js that re-exports from client
if (fs.existsSync(prismaClientPath)) {
  fs.writeFileSync(defaultJsPath, `module.exports = require('./client');\n`);
  fs.writeFileSync(defaultDtsPath, `export * from './client';\n`);
  console.log('✅ Created Prisma default.js and default.d.ts files');
}
