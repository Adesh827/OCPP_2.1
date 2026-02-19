# Remote Control Testing Guide

## Overview
The remote control feature allows the server to send commands to connected charge points to start or stop charging sessions remotely. This implements OCPP 1.6 `RemoteStartTransaction` and `RemoteStopTransaction` messages.

## Quick Start

### 1. Start the OCPP Server
```bash
npm start
```

### 2. Connect a Test Charger
Open a new terminal and run:
```bash
node test-remote-control.js
```

This will:
- Connect a charger named `TEST_REMOTE_CP` to the server
- Report connector 1 as Available
- Wait for remote commands from the dashboard

### 3. Open the Dashboard
Go to: http://localhost:8080/dashboard.html

### 4. Test Remote Start
In the "Remote Control" section:
1. **Charger ID**: `TEST_REMOTE_CP`
2. **Connector ID**: `1`
3. **ID Tag**: `USER001`
4. Click "▶️ Start Charging"

You should see:
- Success message in the dashboard
- The test charger automatically starts a transaction
- Transaction appears in "Active Charging Sessions"

### 5. Test Remote Stop
In the "Remote Control" section:
1. **Charger ID**: `TEST_REMOTE_CP`
2. **Transaction ID**: (use the ID from the active session, e.g., `1`)
3. Click "⏹️ Stop Charging"

You should see:
- Success message in the dashboard
- The test charger automatically stops the transaction
- Transaction moves to "Recent Transactions" with stop details

## API Endpoints

### Remote Start
```bash
POST /api/remote-start
Content-Type: application/json

{
  "chargePointId": "TEST_REMOTE_CP",
  "connectorId": 1,
  "idTag": "USER001"
}
```

### Remote Stop
```bash
POST /api/remote-stop
Content-Type: application/json

{
  "chargePointId": "TEST_REMOTE_CP",
  "transactionId": 1
}
```

## Testing with curl

### Remote Start
```bash
curl -X POST http://localhost:8080/api/remote-start \
  -H "Content-Type: application/json" \
  -d "{\"chargePointId\":\"TEST_REMOTE_CP\",\"connectorId\":1,\"idTag\":\"USER001\"}"
```

### Remote Stop
```bash
curl -X POST http://localhost:8080/api/remote-stop \
  -H "Content-Type: application/json" \
  -d "{\"chargePointId\":\"TEST_REMOTE_CP\",\"transactionId\":1}"
```

## How It Works

### Server → Charger Communication
1. Server stores WebSocket connections in `connectedChargers` Map
2. Dashboard sends POST request to `/api/remote-start` or `/api/remote-stop`
3. Server creates OCPP CALL message `[2, messageId, action, payload]`
4. Server sends message to charger via WebSocket
5. Server waits for CALLRESULT `[3, messageId, result]`
6. Server returns result to dashboard

### Message Flow Example (Remote Start)

**Server → Charger:**
```json
[2, "1", "RemoteStartTransaction", {
  "connectorId": 1,
  "idTag": "USER001"
}]
```

**Charger → Server:**
```json
[3, "1", {
  "status": "Accepted"
}]
```

**Charger → Server (auto-triggered):**
```json
[2, "10", "StartTransaction", {
  "connectorId": 1,
  "idTag": "USER001",
  "meterStart": 0,
  "timestamp": "2024-01-20T10:30:00Z"
}]
```

## Error Handling

### Charger Not Connected
If the charger is offline, you'll see:
```json
{
  "success": false,
  "error": "Charger TEST_REMOTE_CP not connected"
}
```

### Invalid Request
Missing fields will return:
```json
{
  "success": false,
  "error": "Missing required fields: chargePointId, connectorId, idTag"
}
```

### Timeout
If charger doesn't respond in 30 seconds:
```json
{
  "success": false,
  "error": "Request timeout"
}
```

## Simulator Support

All simulators (simulator.js, simulator2.js) now support remote control:
- They listen for incoming CALL messages
- Respond with CALLRESULT
- Auto-trigger appropriate actions (StartTransaction, StopTransaction)

## Notes for Demo

1. **Show bidirectional communication**: Emphasize that OCPP requires both charger→server (traditional) and server→charger (remote control)
2. **Real-world use case**: Remote control is used for:
   - Fleet management
   - Load balancing
   - Emergency shutdowns
   - Scheduled charging
3. **Protocol compliance**: This implements OCPP 1.6 specification for RemoteStartTransaction and RemoteStopTransaction
4. **Error handling**: Show what happens when charger is offline
5. **Real-time updates**: Dashboard updates automatically after remote commands

## Troubleshooting

### "Charger not connected" error
- Make sure `test-remote-control.js` is running
- Check charger ID matches exactly (case-sensitive)

### No transaction ID
- Start a transaction first using Remote Start
- Check "Active Charging Sessions" for the transaction ID

### Dashboard not updating
- Wait 2 seconds for auto-refresh
- Or click the refresh button manually
- Check browser console for errors (F12)
