import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('ocpp.db');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Database Diagnostic Tool                         ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Check transactions
db.all('SELECT * FROM transactions', (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`📊 Total Transactions: ${rows.length}\n`);
  
  if (rows.length === 0) {
    console.log('⚠️  No transactions found. Run a simulator first!\n');
    db.close();
    return;
  }
  
  console.log('Transaction Details:');
  console.log('─'.repeat(120));
  console.log('ID | Charger | Conn | User | Start(Wh) | Stop(Wh) | Energy | Status | Started | Stopped');
  console.log('─'.repeat(120));
  
  let totalEnergy = 0;
  let validCount = 0;
  let nullCount = 0;
  
  rows.forEach(tx => {
    const start = tx.meter_start !== null ? tx.meter_start : 'NULL';
    const stop = tx.meter_stop !== null ? tx.meter_stop : 'NULL';
    const energy = (tx.meter_stop !== null && tx.meter_start !== null) 
      ? (tx.meter_stop - tx.meter_start) 
      : 'N/A';
    
    if (energy !== 'N/A') {
      totalEnergy += energy;
      validCount++;
    } else {
      nullCount++;
    }
    
    const startTime = tx.start_timestamp ? new Date(tx.start_timestamp).toLocaleTimeString() : 'N/A';
    const stopTime = tx.stop_timestamp ? new Date(tx.stop_timestamp).toLocaleTimeString() : 'N/A';
    
    console.log(
      `${tx.id.toString().padEnd(2)} | ${tx.charge_point_id.substring(0,15).padEnd(15)} | ${tx.connector_id} | ${(tx.id_tag || 'N/A').substring(0,12).padEnd(12)} | ${start.toString().padEnd(9)} | ${stop.toString().padEnd(8)} | ${energy.toString().padEnd(6)} | ${tx.status.padEnd(7)} | ${startTime.padEnd(8)} | ${stopTime}`
    );
  });
  
  console.log('─'.repeat(120));
  console.log(`\n📈 Summary:`);
  console.log(`   Valid transactions with energy data: ${validCount}`);
  console.log(`   Transactions with NULL meter values: ${nullCount}`);
  console.log(`   Total Energy: ${totalEnergy} Wh (${(totalEnergy/1000).toFixed(2)} kWh)`);
  
  if (nullCount > 0) {
    console.log(`\n⚠️  WARNING: ${nullCount} transactions have NULL meter values!`);
    console.log('   This means StopTransaction was not completed properly.');
    console.log('   Possible causes:');
    console.log('   - Transaction ID mismatch');
    console.log('   - Transaction was not in Active state when stopped');
    console.log('   - Simulator disconnected before sending StopTransaction\n');
    
    console.log('💡 Solution: Clear database and run simulator again:');
    console.log('   node clear-db.js');
    console.log('   npm start (in one terminal)');
    console.log('   npm run multi-test (in another terminal)\n');
  }
  
  db.close();
});
