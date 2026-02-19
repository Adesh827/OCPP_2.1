import WebSocket from 'ws';

const SERVER_URL = 'ws://localhost:8080/TEST_REMOTE_CP';
let messageId = 1;
let ws;
let transactionId = null;

function sendMessage(action, payload) {
  const msg = [2, String(messageId++), action, payload];
  console.log(`\n→ Sending: ${action}`);
  console.log(`  Payload:`, JSON.stringify(payload, null, 2));
  ws.send(JSON.stringify(msg));
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Remote Control Test - Waiting for Commands       ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');
console.log(`Connecting to: ${SERVER_URL}\n`);

ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
  console.log('✅ Connected to OCPP Server\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Charger is online and waiting for remote commands...\n');
  
  // Send BootNotification
  console.log('📋 Sending BootNotification...');
  sendMessage('BootNotification', {
    chargePointVendor: 'TestVendor',
    chargePointModel: 'RemoteTest-v1.0',
    chargePointSerialNumber: 'REMOTE-001',
    firmwareVersion: '1.0.0'
  });
  
  // Send StatusNotification - Available
  setTimeout(() => {
    console.log('\n📡 Reporting connector as Available...');
    sendMessage('StatusNotification', {
      connectorId: 1,
      status: 'Available',
      errorCode: 'NoError',
      timestamp: new Date().toISOString()
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 Ready for remote control!');
    console.log('   - Use the dashboard at http://localhost:8080/dashboard.html');
    console.log('   - Charger ID: TEST_REMOTE_CP');
    console.log('   - Connector ID: 1');
    console.log('   - ID Tag: USER001');
    console.log('═══════════════════════════════════════════════════════════\n');
  }, 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  const [messageType, msgId, actionOrPayload, payload] = msg;
  
  if (messageType === 2) { // CALL (incoming request from server)
    const action = actionOrPayload;
    console.log(`\n🎯 ← Received CALL: ${action}`);
    console.log(`   Payload:`, JSON.stringify(payload, null, 2));
    
    if (action === 'RemoteStartTransaction') {
      console.log('   ✅ Processing RemoteStartTransaction...');
      // Send CALLRESULT
      const response = [3, msgId, { status: 'Accepted' }];
      ws.send(JSON.stringify(response));
      console.log('   → Sent CALLRESULT: Accepted');
      
      // Simulate starting the transaction
      setTimeout(() => {
        console.log('\n   🚗 Starting transaction...');
        sendMessage('StatusNotification', {
          connectorId: payload.connectorId,
          status: 'Preparing',
          errorCode: 'NoError',
          timestamp: new Date().toISOString()
        });
        
        setTimeout(() => {
          sendMessage('StartTransaction', {
            connectorId: payload.connectorId,
            idTag: payload.idTag,
            meterStart: 0,
            timestamp: new Date().toISOString()
          });
        }, 1000);
        
        setTimeout(() => {
          sendMessage('StatusNotification', {
            connectorId: payload.connectorId,
            status: 'Charging',
            errorCode: 'NoError',
            timestamp: new Date().toISOString()
          });
        }, 2000);
      }, 500);
      
    } else if (action === 'RemoteStopTransaction') {
      console.log('   ✅ Processing RemoteStopTransaction...');
      // Send CALLRESULT
      const response = [3, msgId, { status: 'Accepted' }];
      ws.send(JSON.stringify(response));
      console.log('   → Sent CALLRESULT: Accepted');
      
      // Simulate stopping the transaction
      setTimeout(() => {
        console.log('\n   🛑 Stopping transaction...');
        sendMessage('StopTransaction', {
          transactionId: payload.transactionId,
          meterStop: 5000,
          timestamp: new Date().toISOString(),
          idTag: 'USER001',
          reason: 'Remote'
        });
        
        setTimeout(() => {
          sendMessage('StatusNotification', {
            connectorId: 1,
            status: 'Finishing',
            errorCode: 'NoError',
            timestamp: new Date().toISOString()
          });
        }, 1000);
        
        setTimeout(() => {
          sendMessage('StatusNotification', {
            connectorId: 1,
            status: 'Available',
            errorCode: 'NoError',
            timestamp: new Date().toISOString()
          });
          console.log('\n   ✅ Transaction stopped, connector available again');
        }, 2000);
      }, 500);
    }
    
  } else if (messageType === 3) { // CallResult
    console.log(`  ← Response: SUCCESS`);
    console.log(`     Data:`, JSON.stringify(actionOrPayload, null, 2));
    
    // Capture transaction ID
    if (actionOrPayload.transactionId) {
      transactionId = actionOrPayload.transactionId;
      console.log(`     💾 Transaction ID: ${transactionId}`);
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
  console.log('\n🔌 Disconnected from server');
  process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  ws.close();
});
