const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma', 'client');
const clientTsPath = path.join(prismaClientPath, 'client.ts');
const clientJsPath = path.join(prismaClientPath, 'client.js');

if (!fs.existsSync(clientTsPath)) {
  console.log('⚠️  Prisma client.ts not found, skipping transpilation');
  process.exit(0);
}

try {
  // Use tsc to transpile the TypeScript file to JavaScript
  // This creates a JavaScript version that Node.js can execute during build
  const tscPath = path.join(projectRoot, 'node_modules', '.bin', 'tsc');
  
  if (fs.existsSync(tscPath)) {
    // Create a temporary tsconfig for transpilation
    const tempTsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: false,
        outDir: prismaClientPath,
        rootDir: prismaClientPath,
      },
      include: [path.join(prismaClientPath, 'client.ts')],
    };
    
    const tempTsConfigPath = path.join(prismaClientPath, 'tsconfig.temp.json');
    fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));
    
    try {
      execSync(`${tscPath} --project ${tempTsConfigPath}`, {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      
      // Clean up temp config
      fs.unlinkSync(tempTsConfigPath);
      
      console.log('✅ Transpiled Prisma client.ts to client.js');
    } catch (error) {
      console.warn('⚠️  Failed to transpile Prisma client, continuing with TypeScript version');
      if (fs.existsSync(tempTsConfigPath)) {
        fs.unlinkSync(tempTsConfigPath);
      }
    }
  } else {
    console.log('⚠️  TypeScript compiler not found, skipping transpilation');
  }
} catch (error) {
  console.warn('⚠️  Error transpiling Prisma client:', error.message);
  // Don't fail the build if transpilation fails
  process.exit(0);
}

