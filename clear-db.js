import sqlite3 from 'sqlite3';
import fs from 'fs';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Database Reset Tool                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('⚠️  This will DELETE the database and start fresh!\n');

if (fs.existsSync('ocpp.db')) {
  fs.unlinkSync('ocpp.db');
  console.log('✅ Database deleted successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start the server: npm start');
  console.log('   2. Run simulator: npm run simulate');
  console.log('   3. Check dashboard: http://localhost:8080/dashboard.html\n');
} else {
  console.log('ℹ️  No database file found. It will be created when you start the server.\n');
}
