import fs from "fs";
import https from "https";
import express, { response } from "express";
import { WebSocketServer } from "ws";
let port=8080;
const app=express();


const serverOptions = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.crt"),
  ca: fs.readFileSync("./certs/ca.crt"),
  requestCert: true,
  rejectUnauthorized: false
}
const httpsServer = https.createServer(serverOptions, app);

const wss = new WebSocketServer({ server: httpsServer });


wss.on("connection",(ws,req)=>{
    const cert = req.socket.getPeerCertificate();
  
  if (req.client.authorized) {
    console.log("✅ Client authenticated:", cert.subject.CN);
    ws.send("Hello, secure WebSocket client!"); 
  } else {
    console.log("❌ Unauthorized client:", req.client.authorizationError);
    ws.terminate();
  }

    ws.on('message', message => {
        console.log(`Received message from Charge Point: ${message}`);
        try {
            const ocppMessage = JSON.parse(message);
            if (ocppMessage[2] === 'BootNotification') {
                const chargePointId = ocppMessage[3].chargePointVendor; 
                console.log(`BootNotification from: ${chargePointId}`);
                const response = [3, ocppMessage[1], {
                    "currentTime": new Date().toISOString(),
                    "interval": 300,
                    "status": "Accepted"
                }];
                ws.send(JSON.stringify(response));
                console.log('Sent BootNotificationResponse');
            } else {
                console.log('Unhandled OCPP message type');
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }

    })

});

httpsServer.listen(port, () => {
  console.log(`HTTPS + Express running on https://localhost:${port}`);
  console.log(`🔐 WebSocket running on wss://localhost:${port}`);
});