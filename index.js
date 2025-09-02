import express, { response } from "express";
import { WebSocketServer } from "ws";
let port=8080;
const app=express();

const server=app.listen(port, ()=>{
    console.log("app is lisning on port",port);
})

const wss= new WebSocketServer({server});

wss.on("connection",(ws)=>{
   console.log('Charge Point connected');

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