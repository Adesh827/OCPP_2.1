# OCPP 2.1 - EV Charging Point Management System

A software-based EV Charging Station Management System implementing OCPP 1.6 protocol for secure, real-time communication between charging stations and a centralized backend server.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on `http://localhost:8080`

### 3. Run the Simulator (Demo)
```bash
npm run simulate
```

This will simulate a complete charging session:
- Boot notification
- User authorization
- Start charging transaction
- Send meter values
- Stop transaction

### 4. View the Dashboard
Open your browser and go to:
```
http://localhost:8080/dashboard.html
```

## 📡 API Endpoints

All endpoints return JSON data:

### System Overview
- `GET /api/dashboard` - Complete system statistics

### Chargers
- `GET /api/chargers` - List all registered chargers
- `GET /api/chargers/:id` - Get specific charger details

### Transactions
- `GET /api/transactions` - List all transactions (supports `?limit=50&offset=0`)
- `GET /api/transactions/:id` - Get specific transaction
- `GET /api/transactions/active` - List only active charging sessions

### Monitoring
- `GET /api/status` - Recent status notifications (supports `?limit=20`)
- `GET /api/meter-values` - Recent meter readings (supports `?limit=20`)

## 🔌 OCPP Messages Supported

1. **BootNotification** - Charger registration
2. **Heartbeat** - Keep-alive mechanism
3. **Authorize** - User/RFID validation  
4. **StartTransaction** - Begin charging session
5. **StopTransaction** - End charging session
6. **StatusNotification** - Connector status updates
7. **MeterValues** - Energy consumption reporting

## 🎯 Demo for Project Presentation

### Step-by-Step Demo:

1. **Start Server**
   ```bash
   npm start
   ```
   Show the terminal output with available endpoints

2. **Run Simulator**
   ```bash
   npm run simulate
   ```
   Explain each step as it executes (Boot → Authorize → Start → Meter → Stop)

3. **Show Dashboard**
   - Open `http://localhost:8080/dashboard.html`
   - Point out:
     - Statistics cards (chargers, sessions, energy)
     - Active sessions table
     - Transaction history
     - Status notifications
   - Click "Refresh" to show real-time updates

4. **Show API Responses**
   - Open `http://localhost:8080/api/dashboard`
   - Show clean JSON structure
   - Demonstrate other endpoints like `/api/transactions`

5. **Show Database**
   - Open `ocpp.db` with SQLite viewer
   - Show stored chargers, transactions, meter values

## 📊 Database Schema

- **chargers** - Charging station registry
- **transactions** - Charging sessions with energy data
- **status_notifications** - Connector/charger status updates
- **meter_values** - Energy consumption readings
- **id_tags** - User/RFID authorization tokens

## 🔐 Security Features (Planned)

- TLS/SSL for WebSocket connections
- Token-based REST API authentication
- Charge point ID whitelist

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - HTTP server and REST API
- **WebSocket (ws)** - Real-time bidirectional communication
- **SQLite3** - Persistent data storage
- **OCPP 1.6** - Open Charge Point Protocol

## 📈 Project Roadmap

✅ **Completed:**
- Core OCPP message handling
- Database persistence
- REST API for monitoring
- Web dashboard
- Charge point simulator

🔄 **In Progress:**
- TLS/SSL security
- Advanced business rules
- Load balancing

📋 **Planned:**
- User management
- Payment integration
- Mobile app
- Smart grid integration

## 🎓 College Project Information

This is a final year engineering project demonstrating:
- Protocol implementation (OCPP 1.6)
- Real-time WebSocket communication
- RESTful API design
- Database design and management
- Full-stack development
- System architecture and scalability

## 📝 Testing

### Manual Testing with Simulator:
```bash
npm run simulate
```

### Testing with Real Charge Points:
Configure your OCPP-compliant charge point to connect to:
```
ws://localhost:8080/YOUR_CHARGER_ID
```

### API Testing:
Use Postman, curl, or browser:
```bash
curl http://localhost:8080/api/dashboard
```

## 🤝 Contributing

This is an educational project. Feedback and suggestions are welcome!

## 📄 License

ISC

---

**Author:** Engineering College Final Year Project  
**Last Updated:** February 2026
