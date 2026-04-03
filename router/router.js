import express from "express";
const Router=express.Router();

import sqlite3 from "sqlite3";import e from "express";
import {dbRun,dbGet,dbAll} from '../dbs/dbs.js';

Router.get("/api/chargers", async (req, res) => {
  try {
    const chargers = await dbAll("SELECT * FROM chargers ORDER BY last_seen DESC");
    res.json({ count: chargers.length, chargers });
  } catch (err) {
    log("error", "API error /api/chargers:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. Get specific charger
Router.get("/api/chargers/:id", async (req, res) => {
  try {
    const charger = await dbGet("SELECT * FROM chargers WHERE id = ?", [req.params.id]);
    if (!charger) {
      return res.status(404).json({ error: "Charger not found" });
    }
    res.json(charger);
  } catch (err) {
    log("error", "API error /api/chargers/:id:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// 3. Get active transactions
Router.get("/api/transactions/active", async (req, res) => {
  try {
    const transactions = await dbAll(
      "SELECT * FROM transactions WHERE status = 'Active' ORDER BY start_timestamp DESC"
    );
    res.json({ count: transactions.length, transactions });
  } catch (err) {
    log("error", "API error /api/transactions/active:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// 4. Get all transactions (with pagination)
Router.get("/api/transactions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const transactions = await dbAll(
      "SELECT * FROM transactions ORDER BY start_timestamp DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    const total = await dbGet("SELECT COUNT(*) as count FROM transactions");
    res.json({ 
      count: transactions.length, 
      total: total.count,
      transactions 
    });
  } catch (err) {
    log("error", "API error /api/transactions:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// 5. Get specific transaction
Router.get("/api/transactions/:id", async (req, res) => {
  try {
    const transaction = await dbGet("SELECT * FROM transactions WHERE id = ?", [req.params.id]);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (err) {
    log("error", "API error /api/transactions/:id:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// 6. Get recent status notifications
Router.get("/api/status", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const statuses = await dbAll(
      "SELECT * FROM status_notifications ORDER BY timestamp DESC LIMIT ?",
      [limit]
    );
    res.json({ count: statuses.length, statuses });
  } catch (err) {
    log("error", "API error /api/status:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

Router.get("/api/meter-values", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const meterValues = await dbAll(
      "SELECT * FROM meter_values ORDER BY timestamp DESC LIMIT ?",
      [limit]
    );
    res.json({ count: meterValues.length, meterValues });
  } catch (err) {
    log("error", "API error /api/meter-values:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

Router.get("/api/dashboard", async (req, res) => {
  try {
    const totalChargers = await dbGet("SELECT COUNT(*) as count FROM chargers");
    const activeTransactions = await dbGet(
      "SELECT COUNT(*) as count FROM transactions WHERE status = 'Active'"
    );
    const totalSessions = await dbGet("SELECT COUNT(*) as count FROM transactions");
    const completedSessions = await dbGet(
      "SELECT COUNT(*) as count FROM transactions WHERE status = 'Stopped'"
    );
    const totalEnergy = await dbGet(
      "SELECT COALESCE(SUM(CAST(meter_stop AS INTEGER) - CAST(meter_start AS INTEGER)), 0) as total FROM transactions WHERE meter_stop IS NOT NULL AND meter_start IS NOT NULL"
    );
    const recentChargers = await dbAll(
      "SELECT id, vendor, model, last_seen FROM chargers ORDER BY last_seen DESC LIMIT 5"
    );

    res.json({
      chargers: totalChargers.count,
      activeSessions: activeTransactions.count,
      totalSessions: totalSessions.count,
      completedSessions: completedSessions.count,
      totalEnergyWh: totalEnergy.total || 0,
      recentChargers: recentChargers
    });
  } catch (err) {
    log("error", "API error /api/dashboard:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// 9. Analytics endpoint for charts

Router.get("/api/analytics", async (req, res) => {
  try {
    // Energy by charger
    const energyByCharger = await dbAll(`
      SELECT 
        charge_point_id,
        COUNT(*) as session_count,
        COALESCE(SUM(CAST(meter_stop AS INTEGER) - CAST(meter_start AS INTEGER)), 0) as total_energy_wh
      FROM transactions 
      WHERE meter_stop IS NOT NULL AND meter_start IS NOT NULL
      GROUP BY charge_point_id
      ORDER BY total_energy_wh DESC
    `);

    // Transactions timeline (last 24 hours)
    const timeline = await dbAll(`
      SELECT 
        id,
        charge_point_id,
        CAST(meter_stop AS INTEGER) - CAST(meter_start AS INTEGER) as energy_wh,
        start_timestamp,
        stop_timestamp,
        status
      FROM transactions 
      WHERE meter_stop IS NOT NULL AND meter_start IS NOT NULL
      ORDER BY stop_timestamp DESC
      LIMIT 50
    `);

    // Status distribution
    const statusDist = await dbAll(`
      SELECT status, COUNT(*) as count
      FROM transactions
      GROUP BY status
    `);

    res.json({
      energyByCharger,
      timeline,
      statusDistribution: statusDist
    });
  } catch (err) {
    log("error", "API error /api/analytics:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});


export default Router;