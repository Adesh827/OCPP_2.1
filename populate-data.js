import WebSocket from 'ws';

// This script populates the database with multiple transactions for better chart visualization
const scenarios = [
  { id: 'MALL_STATION_A1', vendor: 'ABB', model: 'Terra AC', user: 'CARD_001', energy: 8500, delay: 0 },
  { id: 'MALL_STATION_A2', vendor: 'ABB', model: 'Terra AC', user: 'CARD_002', energy: 12000, delay: 200 },
  { id: 'HIGHWAY_FAST_01', vendor: 'Tesla', model: 'Supercharger', user: 'TESLA_001', energy: 35000, delay: 400 },
  { id: 'OFFICE_SLOW_B1', vendor: 'ChargePoint', model: 'CP4000', user: 'EMPLOYEE_42', energy: 4500, delay: 600 },
  { id: 'AIRPORT_P1_C3', vendor: 'EVBox', model: 'BusinessLine', user: 'VISITOR_789', energy: 15000, delay: 800 },
  { id: 'HOTEL_GARAGE_02', vendor: 'Wallbox', model: 'Pulsar Plus', user: 'GUEST_456', energy: 7200, delay: 1000 },
  { id: 'HOME_CHARGER_01', vendor: 'Wallbox', model: 'Commander 2', user: 'OWNER_001', energy: 9800, delay: 1200 },
];

let completed = 0;

function simulateSession(config) {
  const SERVER_URL = `ws://localhost:8080/${config.id}`;
  const ws = new WebSocket(SERVER_URL);
  let messageId = 1;
  let txId = null;

  function send(action, payload) {
    ws.send(JSON.stringify([2, String(messageId++), action, payload]));
  }

  ws.on('open', () => {
    console.log(`[${config.id}] ⚡ Starting...`);

    // Boot
    setTimeout(() => send('BootNotification', {
      chargePointVendor: config.vendor,
      chargePointModel: config.model
    }), 100);

    // Auth
    setTimeout(() => send('Authorize', { idTag: config.user }), 300);

    // Start
    setTimeout(() => send('StartTransaction', {
      connectorId: 1,
      idTag: config.user,
      meterStart: 0,
      timestamp: new Date().toISOString()
    }), 500);

    // Stop
    setTimeout(() => {
      if (txId) {
        send('StopTransaction', {
          transactionId: txId,
          meterStop: config.energy,
          timestamp: new Date().toISOString(),
          idTag: config.user
        });
      }
    }, 1500);

    // Close
    setTimeout(() => {
      console.log(`[${config.id}] ✅ Complete (${(config.energy/1000).toFixed(1)} kWh)`);
      ws.close();
      completed++;
      
      if (completed === scenarios.length) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log(`✅ ALL ${scenarios.length} CHARGING SESSIONS COMPLETED!`);
        console.log(`   Total Energy: ${(scenarios.reduce((sum, s) => sum + s.energy, 0) / 1000).toFixed(1)} kWh`);
        console.log('\n📊 Open dashboard to see beautiful charts:');
        console.log('   http://localhost:8080/dashboard.html\n');
        process.exit(0);
      }
    }, 2000);
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg[0] === 3 && msg[2].transactionId) {
      txId = msg[2].transactionId;
    }
  });

  ws.on('error', (err) => {
    console.error(`[${config.id}] ❌`, err.message);
  });
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     Populating Database with Sample Data                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');
console.log(`Creating ${scenarios.length} charging sessions for chart visualization...\n`);

scenarios.forEach((scenario, index) => {
  setTimeout(() => simulateSession(scenario), scenario.delay);
});
