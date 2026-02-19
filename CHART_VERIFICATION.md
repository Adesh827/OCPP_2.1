# 🔍 How to Verify Chart Data is Correct

## Quick Verification (30 seconds)

### Method 1: Using Verification Script
```bash
npm run verify-charts
```

This will show you:
- ✅ Exact data that should appear in each chart
- ✅ Transaction count and energy values
- ✅ Comparison table for manual verification

---

## Manual Verification Steps

### **1. Check Energy Over Time Chart (Line Chart)**

**In Terminal:**
```bash
npm run verify-charts
```

**In Browser:**
1. Open dashboard: `http://localhost:8080/dashboard.html`
2. Press `F12` to open Developer Console
3. Go to "Console" tab
4. Look for: `📈 Energy Chart Data:`
5. You'll see: `{ transactions: 10, data: [...] }`

**Verify:**
- Count the points on the line chart
- Should match the `transactions` count
- Hover over each point to see exact kWh value
- Compare with terminal output

---

### **2. Check Energy by Charger Chart (Bar Chart)**

**In Browser Console:**
- Look for: `📊 Charger Chart Data:`
- Shows: `[{ charger: "...", energy: "X kWh" }, ...]`

**Verify:**
- Count the bars in the chart
- Should match number of unique chargers
- Hover over each bar to see exact value
- Compare with console output

---

### **3. Cross-Check with Database**

**Direct Database Query:**
```bash
npm run check-db
```

This shows raw database data including:
- All transactions
- meter_start and meter_stop values
- Calculated energy (meter_stop - meter_start)

**Verify:**
- Energy values match between database and charts
- Formula: `Energy (kWh) = (meter_stop - meter_start) / 1000`

---

### **4. Check Total Energy Stat Card**

**Verification:**
1. Look at dashboard stat card: "TOTAL ENERGY"
2. Run: `npm run verify-charts`
3. Check "GRAND TOTAL" at the bottom
4. Values should match exactly

**Example:**
```
Dashboard: 26.50 kWh
Terminal:  26.50 kWh  ✅ MATCH!
```

---

## Common Issues & Solutions

### ❌ Charts show 0 or empty
**Solution:**
- No data in database
- Run: `npm run populate` to add sample data
- Or run: `npm run simulate` multiple times

### ❌ Energy values don't match
**Possible causes:**
- `meterStart` or `meterStop` is NULL in database
- Transaction status is not "Stopped"
- Browser cache (hard refresh with Ctrl+F5)

**Solution:**
```bash
npm run clear-db    # Clear database
npm start           # Restart server
npm run populate    # Add fresh data
```

### ❌ Chart not updating
**Solution:**
- Charts auto-refresh every 10 seconds
- Or click "Refresh Data" button
- Or hard refresh browser (Ctrl+F5)

---

## Full Verification Workflow

**Step-by-step verification for your demo:**

```bash
# 1. Clear and start fresh
npm run clear-db
npm start

# 2. Add known test data
npm run populate

# 3. Verify database
npm run verify-charts
```

**Output will show:**
```
📈 ENERGY OVER TIME CHART VERIFICATION
─────────────────────────────────────────
Time Completed  | Charger            | Energy (kWh) | TX ID
12:34:56 PM     | MALL_STATION_A1    |         8.50 | #1
12:35:02 PM     | HIGHWAY_FAST_01    |        35.00 | #3
...

✅ Line chart should show 7 data points

📊 ENERGY BY CHARGER CHART VERIFICATION
─────────────────────────────────────────
Charger Name              | Sessions | Total Energy (kWh)
HIGHWAY_FAST_01           |        1 |              35.00
MALL_STATION_A2           |        1 |              12.00
...

✅ Bar chart should show 7 bars (one per charger)
GRAND TOTAL:                                    92.00 kWh
```

**Then in browser:**
1. Open dashboard
2. Count points on line chart → Should be 7
3. Count bars on bar chart → Should be 7
4. Check "TOTAL ENERGY" card → Should show 92.00 kWh
5. Press F12 → Console → See logged chart data
6. Hover over chart elements to verify exact values

---

## For Your Demo/Presentation

**When guide asks: "How do you know the data is correct?"**

**Your answer:**
1. Show terminal: `npm run verify-charts`
2. Show database raw data
3. Show browser console logs
4. Hover over chart points showing exact matches
5. Show stat card matching total

**This demonstrates:**
- ✅ Data validation skills
- ✅ Testing methodology
- ✅ Debugging capability
- ✅ Attention to detail
- ✅ Professional development practices

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run verify-charts` | Show what SHOULD be in charts |
| `npm run check-db` | Show raw database content |
| Browser F12 Console | See chart data logs in real-time |
| Hover over charts | See exact values |

**TIP:** Always run `npm run verify-charts` before your demo to confirm everything matches! ✅
