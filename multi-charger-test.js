import WebSocket from 'ws';

// This script demonstrates multiple chargers connected simultaneously
const chargers = [
  {
    id: 'HIGHWAY_STATION_01',
    vendor: 'Tesla',
    model: 'Supercharger V3',
    user: 'TESLA_USER_001',
    energy: 12000
  },
  {
    id: 'AIRPORT_PARKING_A3',
    vendor: 'ChargePoint',
    model: 'CT4000',
    user: 'VISITOR_PASS_45',
    energy: 8500
  },
  {
    id: 'OFFICE_BUILDING_B2',
    vendor: 'ABB',
    model: 'Terra AC',
    user: 'EMPLOYEE_CARD_78',
    energy: 6000
  }
];

let activeConnections = 0;

function simulateCharger(chargerConfig) {
  const SERVER_URL = `ws://localhost:8080/${chargerConfig.id}`;
  const ws = new WebSocket(SERVER_URL);
  let messageId = 1;
  let transactionId = null;

  function send(action, payload) {
    const msg = [2, String(messageId++), action, payload];
    ws.send(JSON.stringify(msg));
  }

  ws.on('open', () => {
    activeConnections++;
    console.log(`\n[${chargerConfig.id}] ✅ Connected (${activeConnections} chargers online)`);

    // Boot
    setTimeout(() => {
      console.log(`[${chargerConfig.id}] 📋 Registering...`);
      send('BootNotification', {
        chargePointVendor: chargerConfig.vendor,
        chargePointModel: chargerConfig.model
      });
    }, 500);

    // Authorize
    setTimeout(() => {
      console.log(`[${chargerConfig.id}] 🔐 Authorizing ${chargerConfig.user}...`);
      send('Authorize', { idTag: chargerConfig.user });
    }, 1500);

    // Start Transaction
    setTimeout(() => {
      console.log(`[${chargerConfig.id}] 🚗 Starting charging session...`);
      send('StartTransaction', {
        connectorId: 1,
        idTag: chargerConfig.user,
        meterStart: 0,
        timestamp: new Date().toISOString()
      });
    }, 2500);

    // Meter Values
    setTimeout(() => {
      const energy = Math.floor(chargerConfig.energy * 0.5);
      console.log(`[${chargerConfig.id}] ⚡ Power: ${energy} Wh`);
      send('MeterValues', {
        connectorId: 1,
        transactionId: transactionId,
        meterValue: [{
          timestamp: new Date().toISOString(),
          sampledValue: [{ value: String(energy), unit: 'Wh' }]
        }]
      });
    }, 3500);

    // Note: StopTransaction is now handled in the message handler after receiving transaction ID

    // Cleanup
    setTimeout(() => {
      if (activeConnections > 0) {
        console.log(`[${chargerConfig.id}] ✅ Session complete\n`);
        ws.close();
        activeConnections--;
      }
      
      if (activeConnections === 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ ALL CHARGERS COMPLETED SUCCESSFULLY!');
        console.log('\n📊 Check the dashboard to see all 3 transactions:');
        console.log('   http://localhost:8080/dashboard.html\n');
        process.exit(0);
      }
    }, 6000);
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg[0] === 3 && msg[2] && msg[2].transactionId) {
      transactionId = msg[2].transactionId;
      console.log(`[${chargerConfig.id}] 💾 Transaction ID captured: ${transactionId}`);
      
      // Now that we have transaction ID, schedule the stop
      setTimeout(() => {
        console.log(`[${chargerConfig.id}] 🛑 Completing... Total: ${chargerConfig.energy} Wh`);
        send('StopTransaction', {
          transactionId: transactionId,
          meterStop: chargerConfig.energy,
          timestamp: new Date().toISOString(),
          idTag: chargerConfig.user
        });
      }, 2000);
    }
  });

  ws.on('error', (err) => {
    console.error(`[${chargerConfig.id}] ❌ Error:`, err.message);
  });
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     Multi-Charger Simultaneous Connection Test           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');
console.log('Connecting 3 chargers simultaneously...\n');

// Connect all chargers at once
chargers.forEach((charger, index) => {
  setTimeout(() => {
    simulateCharger(charger);
  }, index * 200); // Slight stagger to avoid overwhelming output
});
