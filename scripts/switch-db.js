const fs = require('fs');
const path = require('path');

const target = process.argv[2];

if (target !== 'postgres' && target !== 'sqlite') {
  console.error('Usage: node switch-db.js [postgres|sqlite]');
  process.exit(1);
}

const sourceFile = target === 'postgres' ? 'schema.postgres.prisma' : 'schema.sqlite.prisma';
const sourcePath = path.join(__dirname, '../prisma', sourceFile);
const destPath = path.join(__dirname, '../prisma/schema.prisma');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Successfully switched database provider to: ${target}`);
} catch (error) {
  console.error(`Error switching database: ${error.message}`);
  process.exit(1);
}
