import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import sqlite3 from "sqlite3";

const app = express();
const PORT = process.env.PORT || 8080; // Render uses environment PORT

app.use(express.json());

app.get("/", (req, res) => {
  res.send("OCPP 1.6 WebSocket server running");
});
import {dbRun,dbGet,dbAll,initDb} from './dbs/dbs.js';

import Router from "./router/router.js";


// REST API Endpoints for monitoring and dashboard

app.use('/',Router);
// Serve static files from public directory
app.use(express.static('public'));

// HTTP server (not HTTPS, Render terminates TLS)
const server = http.createServer(app);

// WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

const state = {
  activeTransactions: new Map(),
  connectedChargers: new Map() // Store active WebSocket connections
};

let callMessageId = 1; // Counter for CALL messages from server


const LOG_LEVELS = ["debug", "info", "warn", "error"];

function log(level, ...args) {
  if (!LOG_LEVELS.includes(level)) {
    console.log(...args);
    return;
  }
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level.toUpperCase()}]`, ...args);
}

function sendCallResult(ws, messageId, payload) {
  ws.send(JSON.stringify([3, messageId, payload]));
}

function sendCallError(ws, messageId, errorCode, errorDescription, errorDetails = {}) {
  ws.send(JSON.stringify([4, messageId, errorCode, errorDescription, errorDetails]));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateRequiredFields(payload, fields) {
  if (!payload || typeof payload !== "object") {
    return fields;
  }
  return fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === "");
}

function getChargePointId(req) {
  const raw = req?.url || "";
  const id = raw.replace(/^\/+/, "");
  return id || "unknown";
}

// Helper function to send CALL messages to charge points
function sendCallToCharger(chargePointId, action, payload) {
  return new Promise((resolve, reject) => {
    const ws = state.connectedChargers.get(chargePointId);
    
    if (!ws || ws.readyState !== 1) { // 1 = OPEN
      reject(new Error(`Charger ${chargePointId} not connected`));
      return;
    }

    const msgId = String(callMessageId++);
    const message = [2, msgId, action, payload];

    // Set up response handler with timeout
    const timeout = setTimeout(() => {
      ws.removeEventListener('message', messageHandler);
      reject(new Error('Request timeout'));
    }, 30000); // 30 second timeout

    const messageHandler = (event) => {
      try {
        const response = JSON.parse(event.data.toString());
        const [messageType, responseId, responsePayload] = response;

        if (responseId === msgId) {
          clearTimeout(timeout);
          ws.removeEventListener('message', messageHandler);

          if (messageType === 3) { // CALLRESULT
            resolve(responsePayload);
          } else if (messageType === 4) { // CALLERROR
            reject(new Error(`OCPP Error: ${response[2]} - ${response[3]}`));
          }
        }
      } catch (err) {
        // Ignore parsing errors for other messages
      }
    };

    ws.addEventListener('message', messageHandler);
    ws.send(JSON.stringify(message));
    log("info", `Sent ${action} to ${chargePointId}, msgId: ${msgId}`);
  });
}

// Remote Start Transaction API
app.post("/api/remote-start", async (req, res) => {
  try {
    const { chargePointId, connectorId, idTag } = req.body;

    if (!chargePointId || !connectorId || !idTag) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: chargePointId, connectorId, idTag" 
      });
    }

    const result = await sendCallToCharger(chargePointId, "RemoteStartTransaction", {
      connectorId: parseInt(connectorId),
      idTag: idTag
    });

    log("info", `RemoteStartTransaction result for ${chargePointId}:`, result);
    res.json({ success: true, result });
  } catch (err) {
    log("error", "RemoteStartTransaction error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remote Stop Transaction API
app.post("/api/remote-stop", async (req, res) => {
  try {
    const { chargePointId, transactionId } = req.body;

    if (!chargePointId || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: chargePointId, transactionId" 
      });
    }

    const result = await sendCallToCharger(chargePointId, "RemoteStopTransaction", {
      transactionId: parseInt(transactionId)
    });

    log("info", `RemoteStopTransaction result for ${chargePointId}:`, result);
    res.json({ success: true, result });
  } catch (err) {
    log("error", "RemoteStopTransaction error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

wss.on("connection", (ws, req) => {
  const chargePointId = getChargePointId(req);
  log("info", "Charge Point connected:", chargePointId);

  // Store the connection
  state.connectedChargers.set(chargePointId, ws);

  ws.on("message", async (message) => {
    let ocpp;
    try {
      ocpp = JSON.parse(message.toString());
    } catch {
      log("warn", "Not a valid OCPP JSON frame");
      return;
    }

    if (!Array.isArray(ocpp) || ocpp.length < 3) {
      log("warn", "Invalid OCPP frame structure");
      return;
    }

    const [messageType, messageId, action, payload] = ocpp;

    // Only handle CALL messages (2)
    if (messageType !== 2) {
      log("debug", "Ignoring non-CALL message type:", messageType);
      return;
    }

    if (!isNonEmptyString(messageId) || !isNonEmptyString(action)) {
      sendCallError(ws, messageId || "unknown", "FormationViolation", "Invalid messageId or action");
      return;
    }

    const now = new Date().toISOString();

    switch (action) {
      case "BootNotification": {
        const missing = validateRequiredFields(payload, ["chargePointVendor", "chargePointModel"]);
        if (missing.length > 0) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "Missing required fields", {
            missing
          });
          break;
        }
        try {
          await dbRun(
            "INSERT INTO chargers (id, vendor, model, last_seen) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET vendor = excluded.vendor, model = excluded.model, last_seen = excluded.last_seen",
            [chargePointId, payload?.chargePointVendor || null, payload?.chargePointModel || null, now]
          );
        } catch (err) {
          log("error", "DB error BootNotification:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }

        sendCallResult(ws, messageId, {
          currentTime: now,
          interval: 50,
          status: "Accepted"
        });
        log("info", "BootNotification handled for", chargePointId);
        break;
      }

      case "Heartbeat": {
        try {
          await dbRun("UPDATE chargers SET last_seen = ? WHERE id = ?", [now, chargePointId]);
        } catch (err) {
          log("error", "DB error Heartbeat:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }
        sendCallResult(ws, messageId, {
          currentTime: now
        });
        log("info", "Heartbeat handled for", chargePointId);
        break;
      }

      case "Authorize": {
        const missing = validateRequiredFields(payload, ["idTag"]);
        if (missing.length > 0) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "Missing required fields", {
            missing
          });
          break;
        }
        try {
          await dbRun(
            "INSERT INTO id_tags (id_tag, status, last_seen) VALUES (?, ?, ?) ON CONFLICT(id_tag) DO UPDATE SET status = excluded.status, last_seen = excluded.last_seen",
            [payload.idTag, "Accepted", now]
          );
          sendCallResult(ws, messageId, {
            idTagInfo: { status: "Accepted" }
          });
        } catch (err) {
          log("error", "DB error Authorize:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }
        log("info", "Authorize handled for", chargePointId);
        break;
      }

      case "StartTransaction": {
        const missing = validateRequiredFields(payload, ["connectorId", "idTag", "meterStart"]);
        if (missing.length > 0) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "Missing required fields", {
            missing
          });
          break;
        }

        if (!isNumber(payload?.connectorId)) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "connectorId must be a number");
          break;
        }

        const connectorKey = `${chargePointId}:${payload.connectorId}`;
        if (state.activeTransactions.has(connectorKey)) {
          sendCallError(ws, messageId, "OccurrenceConstraintViolation", "Active transaction exists for connector");
          break;
        }

        let transactionId;
        try {
          const result = await dbRun(
            "INSERT INTO transactions (charge_point_id, connector_id, id_tag, meter_start, start_timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
            [
              chargePointId,
              payload?.connectorId ?? null,
              payload?.idTag ?? null,
              payload?.meterStart ?? null,
              payload?.timestamp || now,
              "Active"
            ]
          );
          transactionId = result.lastID;
          state.activeTransactions.set(connectorKey, transactionId);
        } catch (err) {
          log("error", "DB error StartTransaction:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }

        sendCallResult(ws, messageId, {
          transactionId,
          idTagInfo: { status: "Accepted" }
        });
        log("info", "StartTransaction handled for", chargePointId, "tx", transactionId);
        break;
      }

      case "StopTransaction": {
        const missing = validateRequiredFields(payload, ["transactionId", "meterStop"]);
        if (missing.length > 0) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "Missing required fields", {
            missing
          });
          break;
        }

        const txId = payload?.transactionId;
        let tx;
        try {
          tx = await dbGet("SELECT * FROM transactions WHERE id = ?", [txId]);
          if (!tx || tx.status !== "Active") {
            sendCallError(ws, messageId, "OccurrenceConstraintViolation", "Unknown or inactive transaction");
            break;
          }
          await dbRun(
            "UPDATE transactions SET status = ?, meter_stop = ?, stop_timestamp = ? WHERE id = ?",
            ["Stopped", payload?.meterStop ?? null, payload?.timestamp || now, txId]
          );
        } catch (err) {
          log("error", "DB error StopTransaction:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }

        const connectorKey = `${chargePointId}:${tx.connector_id || 0}`;
        state.activeTransactions.delete(connectorKey);

        sendCallResult(ws, messageId, {
          idTagInfo: { status: "Accepted" }
        });
        log("info", "StopTransaction handled for", chargePointId, "tx", txId);
        break;
      }

      case "StatusNotification": {
        const missing = validateRequiredFields(payload, ["connectorId", "status", "errorCode"]);
        if (missing.length > 0) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "Missing required fields", {
            missing
          });
          break;
        }

        try {
          await dbRun(
            "INSERT INTO status_notifications (charge_point_id, connector_id, status, error_code, timestamp) VALUES (?, ?, ?, ?, ?)",
            [
              chargePointId,
              payload?.connectorId ?? 0,
              payload?.status || "Unknown",
              payload?.errorCode || "NoError",
              payload?.timestamp || now
            ]
          );
        } catch (err) {
          log("error", "DB error StatusNotification:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }

        sendCallResult(ws, messageId, {});
        log("info", "StatusNotification handled for", chargePointId);
        break;
      }

      case "MeterValues": {
        const missing = validateRequiredFields(payload, ["connectorId", "meterValue"]);
        if (missing.length > 0) {
          sendCallError(ws, messageId, "PropertyConstraintViolation", "Missing required fields", {
            missing
          });
          break;
        }

        try {
          await dbRun(
            "INSERT INTO meter_values (charge_point_id, connector_id, transaction_id, meter_value, timestamp) VALUES (?, ?, ?, ?, ?)",
            [
              chargePointId,
              payload?.connectorId ?? 0,
              payload?.transactionId ?? null,
              JSON.stringify(payload?.meterValue ?? []),
              now
            ]
          );
        } catch (err) {
          log("error", "DB error MeterValues:", err.message);
          sendCallError(ws, messageId, "InternalError", "Database error");
          break;
        }

        sendCallResult(ws, messageId, {});
        log("info", "MeterValues handled for", chargePointId);
        break;
      }

      default: {
        sendCallError(ws, messageId, "NotSupported", `Action ${action} not supported`);
        log("warn", "Unsupported action:", action);
        break;
      }
    }
  });

  ws.on("close", () => {
    state.connectedChargers.delete(chargePointId);
    log("info", "Charge Point disconnected:", chargePointId);
  });
});

initDb()
  .then(() => log("info", "Database initialized"))
  .catch((err) => log("error", "Database initialization failed:", err.message));

server.listen(PORT, () => {
  console.log(`


  🌐 Web Server:        http://localhost:${PORT}
  🔌 WebSocket Endpoint: ws://localhost:${PORT}/<ChargePointID>
  📊 Dashboard:          http://localhost:${PORT}/dashboard.html
  
  📡 API Endpoints:
     GET  /api/dashboard          - System overview
     GET  /api/analytics          - Chart analytics data
     GET  /api/chargers           - List all chargers  
     GET  /api/chargers/:id       - Get charger details
     GET  /api/transactions       - List transactions
     GET  /api/transactions/:id   - Get transaction details
     GET  /api/status             - Status notifications
     GET  /api/meter-values       - Meter readings

  ✅ Server ready to accept connections...
  `);
});
