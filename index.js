import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const PORT = process.env.PORT || 8080;     // Render uses environment PORT

app.get("/", (req, res) => {
  res.send("OCPP WebSocket server running");
});

// HTTP server (not HTTPS, Render terminates TLS)
const server = http.createServer(app);

// WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  console.log("🔌 Charge Point connected:", req.url);

  ws.on("message", (message) => {
    console.log("📩 Received:", message.toString());

    let ocpp;
    try {
      ocpp = JSON.parse(message);
    } catch {
      console.log(" Not a valid OCPP JSON frame");
      return;
    }

    const [messageType, messageId, action, payload] = ocpp;

    // 2 = CALL (BootNotification etc.)
    if (messageType === 2 && action === "BootNotification") {
      console.log(" BootNotification received");
      const response = [
        3,
        messageId,
        {
          currentTime: new Date().toISOString(),
          interval: 50,
          status: "Accepted"
        }
      ];
      ws.send(JSON.stringify(response));
      console.log("📤 BootNotificationResponse sent");
    }
    if (messageType === 2 && action === "BootNotification") {
      console.log(" BootNotification received");
      const response = [
        3,
        messageId,
        {
          currentTime: new Date().toISOString(),
          interval: 50,
          status: "Accepted"
        }
      ];
      ws.send(JSON.stringify(response));
      console.log(" BootNotificationResponse sent");
    }

    if(messageType===2 & action ==="Heartbeat"){
      console.log("Heartbeat accepted");
      const response = [
        3,
        messageId,
        {
          currentTime: new Date().toISOString()
        }
      ];
      ws.send(JSON.stringify(response));
      console.log(" Heartbeat sent");

    }
    else{
      const response=[
        3,
        messageId,{
          default:"Hiiii"
        }
      ]
      ws.send(JSON.stringify(response));
    }

  });

  ws.on("close", () => console.log("🔌 Charge Point disconnected"));
});

server.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log(`🔋 WebSocket OCPP endpoint ready at wss://<render-domain>/CP01`);
});
