import WebSocket from 'ws';

const SERVER_URL = 'ws://localhost:8080/CHARGER_MALL_02';
let messageId = 1;
let ws;
let transactionId = null;

function sendMessage(action, payload) {
  const msg = [2, String(messageId++), action, payload];
  console.log(`\n→ Sending: ${action}`);
  console.log(`  Payload:`, JSON.stringify(payload, null, 2));
  ws.send(JSON.stringify(msg));
}

function simulateChargingSession() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║    OCPP Simulator #2 - Shopping Mall Charger             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`Connecting to: ${SERVER_URL}\n`);

  ws = new WebSocket(SERVER_URL);
  
  ws.on('open', () => {
    console.log('✅ Connected to OCPP Server\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Starting charging session at Shopping Mall...\n');
    
    // Step 1: Boot Notification
    setTimeout(() => {
      console.log('📋 Step 1: Sending BootNotification...');
      sendMessage('BootNotification', {
        chargePointVendor: 'ABB',
        chargePointModel: 'Terra-AC-W7',
        chargePointSerialNumber: 'MALL-02-AC7',
        firmwareVersion: '2.1.5'
      });
    }, 500);
    
    // Step 2: Status Notification - Available
    setTimeout(() => {
      console.log('\n📡 Step 2: Connector Available...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Available',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 1500);
    
    // Step 3: Authorize different user
    setTimeout(() => {
      console.log('\n🔐 Step 3: Authorizing user RFID_7892...');
      sendMessage('Authorize', {
        idTag: 'RFID_7892'
      });
    }, 2500);
    
    // Step 4: Start Transaction
    setTimeout(() => {
      console.log('\n🚗 Step 4: Tesla Model 3 starting charge...');
      sendMessage('StartTransaction', {
        connectorId: 1,
        idTag: 'RFID_7892',
        meterStart: 0,
        timestamp: new Date().toISOString()
      });
    }, 3500);
    
    // Step 5: Status - Charging
    setTimeout(() => {
      console.log('\n📡 Step 5: Status = Charging...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Charging',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 4500);
    
    // Step 6: Meter Values (higher power - 22kW charger)
    setTimeout(() => {
      console.log('\n⚡ Step 6: Meter reading (8500 Wh)...');
      sendMessage('MeterValues', {
        connectorId: 1,
        transactionId: transactionId,
        meterValue: [{
          timestamp: new Date().toISOString(),
          sampledValue: [
            { value: '8500', unit: 'Wh', measurand: 'Energy.Active.Import.Register' },
            { value: '32.5', unit: 'A', measurand: 'Current.Import' },
            { value: '230.5', unit: 'V', measurand: 'Voltage' },
            { value: '22.5', unit: 'kW', measurand: 'Power.Active.Import' }
          ]
        }]
      });
    }, 5500);
    
    // Step 7: More Meter Values
    setTimeout(() => {
      console.log('\n⚡ Step 7: Meter reading (15000 Wh)...');
      sendMessage('MeterValues', {
        connectorId: 1,
        transactionId: transactionId,
        meterValue: [{
          timestamp: new Date().toISOString(),
          sampledValue: [
            { value: '15000', unit: 'Wh', measurand: 'Energy.Active.Import.Register' },
            { value: '32.2', unit: 'A', measurand: 'Current.Import' },
            { value: '229.9', unit: 'V', measurand: 'Voltage' },
            { value: '22.3', unit: 'kW', measurand: 'Power.Active.Import' }
          ]
        }]
      });
    }, 6500);
    
    // Step 8: Stop Transaction
    setTimeout(() => {
      console.log('\n🛑 Step 8: Stopping transaction...');
      sendMessage('StopTransaction', {
        transactionId: transactionId || 1,
        meterStop: 15000,
        timestamp: new Date().toISOString(),
        idTag: 'RFID_7892',
        reason: 'Local'
      });
    }, 7500);
    
    // Step 9: Status - Available
    setTimeout(() => {
      console.log('\n📡 Step 9: Back to Available...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Available',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 8500);
    
    // Final message
    setTimeout(() => {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('✅ Shopping Mall charger session completed!');
      console.log('   Energy delivered: 15 kWh');
      console.log('   User: RFID_7892');
      console.log('\nDisconnecting in 3 seconds...\n');
      
      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 3000);
    }, 9500);
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    const [messageType, msgId, payload] = msg;
    
    if (messageType === 3) { // CallResult
      console.log(`  ← Response: SUCCESS`);
      console.log(`     Data:`, JSON.stringify(payload, null, 2));
      
      if (payload.transactionId) {
        transactionId = payload.transactionId;
        console.log(`     💾 Transaction ID: ${transactionId}`);
      }
    } else if (messageType === 4) { // CallError
      console.log(`  ← Response: ERROR`);
      console.log(`     Code: ${payload}`);
      console.log(`     Description:`, msg[3]);
    }
  });
  
  ws.on('error', (err) => {
    console.error('\n❌ Connection error:', err.message);
    console.log('\n⚠️  Make sure the OCPP server is running!');
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('🔌 Disconnected from server');
  });
}

simulateChargingSession();
