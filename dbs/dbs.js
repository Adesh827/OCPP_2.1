import sqlite3 from "sqlite3";

const db = new sqlite3.Database("ocpp.db");

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

export async function initDb() {
  await dbRun(
    "CREATE TABLE IF NOT EXISTS chargers (id TEXT PRIMARY KEY, vendor TEXT, model TEXT, last_seen TEXT)"
  );
  await dbRun(
    "CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, charge_point_id TEXT, connector_id INTEGER, id_tag TEXT, meter_start INTEGER, meter_stop INTEGER, start_timestamp TEXT, stop_timestamp TEXT, status TEXT)"
  );
  await dbRun(
    "CREATE TABLE IF NOT EXISTS status_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, charge_point_id TEXT, connector_id INTEGER, status TEXT, error_code TEXT, timestamp TEXT)"
  );
  await dbRun(
    "CREATE TABLE IF NOT EXISTS meter_values (id INTEGER PRIMARY KEY AUTOINCREMENT, charge_point_id TEXT, connector_id INTEGER, transaction_id INTEGER, meter_value TEXT, timestamp TEXT)"
  );
  await dbRun(
    "CREATE TABLE IF NOT EXISTS id_tags (id_tag TEXT PRIMARY KEY, status TEXT, last_seen TEXT)"
  );
}