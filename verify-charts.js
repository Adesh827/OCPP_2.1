import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('ocpp.db');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Chart Data Verification Tool                     ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('This tool helps you verify that chart data matches database data.\n');

// Get all completed transactions with energy data
db.all(`
  SELECT 
    id,
    charge_point_id,
    meter_start,
    meter_stop,
    (CAST(meter_stop AS INTEGER) - CAST(meter_start AS INTEGER)) as energy_wh,
    stop_timestamp,
    status
  FROM transactions 
  WHERE meter_stop IS NOT NULL 
    AND meter_start IS NOT NULL
  ORDER BY stop_timestamp DESC
  LIMIT 20
`, (err, transactions) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('📈 ENERGY OVER TIME CHART VERIFICATION');
  console.log('─'.repeat(100));
  console.log('This data should match the line chart on your dashboard:\n');
  
  if (transactions.length === 0) {
    console.log('⚠️  No completed transactions found. Run a simulator first!\n');
    db.close();
    return;
  }

  console.log('Time Completed         | Charger            | Energy (kWh) | TX ID');
  console.log('─'.repeat(100));
  
  transactions.forEach(tx => {
    const time = new Date(tx.stop_timestamp).toLocaleTimeString();
    const energyKwh = (tx.energy_wh / 1000).toFixed(2);
    const charger = tx.charge_point_id.substring(0, 18).padEnd(18);
    console.log(`${time.padEnd(22)} | ${charger} | ${energyKwh.padStart(12)} | #${tx.id}`);
  });

  console.log('─'.repeat(100));
  console.log(`\n✅ Line chart should show ${transactions.length} data points\n`);

  // Now check energy by charger
  db.all(`
    SELECT 
      charge_point_id,
      COUNT(*) as session_count,
      SUM(CAST(meter_stop AS INTEGER) - CAST(meter_start AS INTEGER)) as total_energy_wh
    FROM transactions 
    WHERE meter_stop IS NOT NULL 
      AND meter_start IS NOT NULL
    GROUP BY charge_point_id
    ORDER BY total_energy_wh DESC
  `, (err, chargers) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    console.log('\n📊 ENERGY BY CHARGER CHART VERIFICATION');
    console.log('─'.repeat(100));
    console.log('This data should match the bar chart on your dashboard:\n');
    console.log('Charger Name                      | Sessions | Total Energy (kWh) | Total (Wh)');
    console.log('─'.repeat(100));

    let grandTotal = 0;
    chargers.forEach(charger => {
      const name = charger.charge_point_id.substring(0, 33).padEnd(33);
      const sessions = charger.session_count.toString().padStart(8);
      const energyKwh = (charger.total_energy_wh / 1000).toFixed(2).padStart(18);
      const energyWh = charger.total_energy_wh.toString().padStart(11);
      console.log(`${name} | ${sessions} | ${energyKwh} | ${energyWh}`);
      grandTotal += charger.total_energy_wh;
    });

    console.log('─'.repeat(100));
    console.log(`GRAND TOTAL:                                      ${(grandTotal / 1000).toFixed(2).padStart(18)} | ${grandTotal.toString().padStart(11)}`);
    console.log('─'.repeat(100));

    console.log(`\n✅ Bar chart should show ${chargers.length} bars (one per charger)\n`);

    console.log('\n📋 HOW TO VERIFY:\n');
    console.log('1. Open dashboard: http://localhost:8080/dashboard.html');
    console.log('2. Open browser console (F12 → Console tab)');
    console.log('3. Look for debug logs showing chart data');
    console.log('4. Compare the values above with what you see in:');
    console.log('   - Line chart: Each point = one transaction');
    console.log('   - Bar chart: Each bar = one charger total');
    console.log('   - Stat cards: "TOTAL ENERGY" should match grand total\n');

    console.log('💡 TIP: Hover over chart points to see exact values!\n');

    db.close();
  });
});
