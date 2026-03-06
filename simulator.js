import WebSocket from 'ws';
import fs from 'fs';

const SERVER_URL = 'wss://localhost:8443/SIMULATOR_CP01';

// TLS/SSL options for secure WebSocket connection
const wsOptions = {
  key: fs.readFileSync('./certs/client-key.pem'),
  cert: fs.readFileSync('./certs/client-cert.pem'),
  ca: fs.readFileSync('./certs/ca-cert.pem'),
  rejectUnauthorized: false // Allow self-signed certificates
};
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
  console.log('║    OCPP Charge Point Simulator (TLS Enabled)             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`Connecting to: ${SERVER_URL}`);
  console.log('🔒 Security: TLS/SSL Enabled (WSS)\n');

  ws = new WebSocket(SERVER_URL, wsOptions);
  
  ws.on('open', () => {
    console.log('✅ Connected to OCPP Server\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Starting charging session simulation...\n');
    
    // Step 1: Boot Notification
    setTimeout(() => {
      console.log('📋 Step 1: Sending BootNotification...');
      sendMessage('BootNotification', {
        chargePointVendor: 'DemoVendor',
        chargePointModel: 'SimCharger-v1.0',
        chargePointSerialNumber: 'SIM-001',
        firmwareVersion: '1.0.0'
      });
    }, 500);
    
    // Step 2: Heartbeat
    setTimeout(() => {
      console.log('\n💓 Step 2: Sending Heartbeat...');
      sendMessage('Heartbeat', {});
    }, 1500);
    
    // Step 3: Status Notification - Available
    setTimeout(() => {
      console.log('\n📡 Step 3: Sending StatusNotification (Available)...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Available',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 2500);
    
    // Step 4: Authorize
    setTimeout(() => {
      console.log('\n🔐 Step 4: Authorizing user...');
      sendMessage('Authorize', {
        idTag: 'USER001'
      });
    }, 3500);
    
    // Step 5: Start Transaction
    setTimeout(() => {
      console.log('\n🚗 Step 5: Starting charging transaction...');
      sendMessage('StartTransaction', {
        connectorId: 1,
        idTag: 'USER001',
        meterStart: 0,
        timestamp: new Date().toISOString()
      });
    }, 4500);
    
    // Step 6: Status Notification - Charging
    setTimeout(() => {
      console.log('\n📡 Step 6: Updating status to Charging...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Charging',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 5500);
    
    // Step 7: Meter Values (during charging)
    setTimeout(() => {
      console.log('\n⚡ Step 7: Sending meter values (1500 Wh)...');
      sendMessage('MeterValues', {
        connectorId: 1,
        transactionId: transactionId,
        meterValue: [{
          timestamp: new Date().toISOString(),
          sampledValue: [
            { value: '1500', unit: 'Wh', measurand: 'Energy.Active.Import.Register' },
            { value: '16.5', unit: 'A', measurand: 'Current.Import' },
            { value: '230.2', unit: 'V', measurand: 'Voltage' }
          ]
        }]
      });
    }, 6500);
    
    // Step 8: More Meter Values
    setTimeout(() => {
      console.log('\n⚡ Step 8: Sending meter values (3500 Wh)...');
      sendMessage('MeterValues', {
        connectorId: 1,
        transactionId: transactionId,
        meterValue: [{
          timestamp: new Date().toISOString(),
          sampledValue: [
            { value: '3500', unit: 'Wh', measurand: 'Energy.Active.Import.Register' },
            { value: '16.3', unit: 'A', measurand: 'Current.Import' },
            { value: '229.8', unit: 'V', measurand: 'Voltage' }
          ]
        }]
      });
    }, 7500);
    
    // Step 9: Final Meter Values
    setTimeout(() => {
      console.log('\n⚡ Step 9: Sending final meter values (5000 Wh)...');
      sendMessage('MeterValues', {
        connectorId: 1,
        transactionId: transactionId,
        meterValue: [{
          timestamp: new Date().toISOString(),
          sampledValue: [
            { value: '5000', unit: 'Wh', measurand: 'Energy.Active.Import.Register' },
            { value: '0', unit: 'A', measurand: 'Current.Import' },
            { value: '230.0', unit: 'V', measurand: 'Voltage' }
          ]
        }]
      });
    }, 8500);
    
    // Step 10: Stop Transaction
    setTimeout(() => {
      console.log('\n🛑 Step 10: Stopping transaction...');
      sendMessage('StopTransaction', {
        transactionId: transactionId || 1,
        meterStop: 5000,
        timestamp: new Date().toISOString(),
        idTag: 'USER001',
        reason: 'Local'
      });
    }, 9500);
    
    // Step 11: Status Notification - Finishing
    setTimeout(() => {
      console.log('\n📡 Step 11: Updating status to Finishing...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Finishing',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 10500);
    
    // Step 12: Status Notification - Available
    setTimeout(() => {
      console.log('\n📡 Step 12: Returning to Available status...');
      sendMessage('StatusNotification', {
        connectorId: 1,
        status: 'Available',
        errorCode: 'NoError',
        timestamp: new Date().toISOString()
      });
    }, 11500);
    
    // Final message
    setTimeout(() => {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('✅ Simulation completed successfully!');
      console.log('\n📊 Check the results:');
      console.log('   - Dashboard: http://localhost:8080/dashboard.html');
      console.log('   - API: http://localhost:8080/api/dashboard');
      console.log('   - Transactions: http://localhost:8080/api/transactions');
      console.log('\nDisconnecting in 3 seconds...\n');
      
      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 3000);
    }, 12500);
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    const [messageType, msgId, actionOrPayload, payload] = msg;
    
    if (messageType === 2) { // CALL (incoming request from server)
      const action = actionOrPayload;
      console.log(`\n← Received CALL: ${action}`);
      console.log(`   Payload:`, JSON.stringify(payload, null, 2));
      
      if (action === 'RemoteStartTransaction') {
        console.log('   🎯 Processing RemoteStartTransaction...');
        // Send CALLRESULT
        const response = [3, msgId, { status: 'Accepted' }];
        ws.send(JSON.stringify(response));
        console.log('   → Sent CALLRESULT: Accepted');
        
        // Simulate starting the transaction
        setTimeout(() => {
          console.log('   🚗 Auto-starting transaction due to remote command...');
          sendMessage('StartTransaction', {
            connectorId: payload.connectorId,
            idTag: payload.idTag,
            meterStart: 0,
            timestamp: new Date().toISOString()
          });
        }, 1000);
        
      } else if (action === 'RemoteStopTransaction') {
        console.log('   🎯 Processing RemoteStopTransaction...');
        // Send CALLRESULT
        const response = [3, msgId, { status: 'Accepted' }];
        ws.send(JSON.stringify(response));
        console.log('   → Sent CALLRESULT: Accepted');
        
        // Simulate stopping the transaction
        setTimeout(() => {
          console.log('   🛑 Auto-stopping transaction due to remote command...');
          sendMessage('StopTransaction', {
            transactionId: payload.transactionId,
            meterStop: 5000,
            timestamp: new Date().toISOString(),
            idTag: 'USER001',
            reason: 'Remote'
          });
        }, 1000);
      }
      
    } else if (messageType === 3) { // CallResult
      console.log(`  ← Response: SUCCESS`);
      console.log(`     Data:`, JSON.stringify(actionOrPayload, null, 2));
      
      // Capture transaction ID
      if (actionOrPayload.transactionId) {
        transactionId = actionOrPayload.transactionId;
        console.log(`     💾 Saved Transaction ID: ${transactionId}`);
      }
    } else if (messageType === 4) { // CallError
      console.log(`  ← Response: ERROR`);
      console.log(`     Code: ${actionOrPayload}`);
      console.log(`     Description:`, payload);
    }
  });
  
  ws.on('error', (err) => {
    console.error('\n❌ Connection error:', err.message);
    console.log('\n⚠️  Make sure the OCPP server is running!');
    console.log('   Run: npm start');
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('🔌 Disconnected from server');
  });
}

// Start the simulation
simulateChargingSession();
