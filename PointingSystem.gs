function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());

  const COL = {
    date:        headers.indexOf("Date"),
    owner:       headers.indexOf("Owner"),
    coordinator: headers.indexOf("Group Coordinator"),
    medium:      headers.indexOf("Medium"),
    status:      headers.indexOf("Session Status"),
    attendance:  headers.indexOf("Attendance"),
    records:     headers.indexOf("Records"),
    materials:   headers.indexOf("Material"),
  };

  const MIN_SESSIONS = 24;

  // ── CYCLE DATES ───────────────────────────────────────────────────
  const allDates = data.slice(1)
    .map(r => r[COL.date])
    .filter(d => d instanceof Date)
    .sort((a, b) => a - b);

  const fmt = d => Utilities.formatDate(d, Session.getScriptTimeZone(), "MMM d, yyyy");
  const cycleStart = allDates.length > 0 ? fmt(allDates[0]) : "N/A";
  const cycleEnd   = allDates.length > 0 ? fmt(allDates[allDates.length - 1]) : "N/A";

  // ── AGGREGATE ─────────────────────────────────────────────────────
  const coordinators = {};

  data.slice(1).forEach(row => {
    const name   = (row[COL.coordinator] || "").toString().trim();
    const status = (row[COL.status]      || "").toString().trim().toLowerCase();
    const medium = (row[COL.medium]      || "").toString().trim().toLowerCase();

    if (!name) return;
    if (status !== "active") return;

    if (!coordinators[name]) {
      coordinators[name] = {
        name,
        totalSessions:   0,
        attendanceScore: 0,
        recordsScore:    0,
        materialsScore:  0,
        penalties:       0,
      };
    }

    const c = coordinators[name];
    c.totalSessions++;

    // ── ATTENDANCE ──────────────────────────────────────────────
    const att = (row[COL.attendance] || "").toString().trim().toLowerCase();
    if      (att === "on time")              { c.attendanceScore += 1; }
    else if (att === "delayed")              { c.attendanceScore += 1; c.penalties += 0.5; }
    else if (att === "not done" || att === "") { c.penalties += 1; }

    // ── RECORDS (penalty only if online) ───────────────────────
    const rec    = (row[COL.records] || "").toString().trim().toLowerCase();
    const online = medium.includes("online");
    if      (rec === "on time")  { c.recordsScore += 1; }
    else if (rec === "delayed")  { c.recordsScore += 1; c.penalties += 0.5; }
    else if ((rec === "not done" || rec === "") && online) { c.penalties += 1; }

    // ── MATERIALS ───────────────────────────────────────────────
    const mat = (row[COL.materials] || "").toString().trim().toLowerCase();
    if      (mat === "on time")              { c.materialsScore += 1; }
    else if (mat === "delayed")              { c.materialsScore += 1; c.penalties += 0.5; }
    else if (mat === "not done" || mat === "") { c.penalties += 1; }
  });

  // ── CALCULATE SCORES ──────────────────────────────────────────────
  const qualified   = [];
  const notEnough   = [];

  Object.values(coordinators).forEach(c => {
    const maxPoints   = c.totalSessions * 3;
    const rawPoints   = c.attendanceScore + c.recordsScore + c.materialsScore;
    const totalPoints = rawPoints - c.penalties;
    const percentage  = maxPoints > 0
      ? Math.round((totalPoints / maxPoints) * 100)
      : 0;

    let performance;
    if      (percentage >= 95) performance = "Excellent";
    else if (percentage >= 75) performance = "Good";
    else if (percentage >= 60) performance = "Needs Improvement";
    else                       performance = "Weak";

    const entry = {
      name:            c.name,
      totalSessions:   c.totalSessions,
      attendanceScore: c.attendanceScore,
      recordsScore:    c.recordsScore,
      materialsScore:  c.materialsScore,
      penalties:       Math.round(c.penalties * 10) / 10,
      totalPoints:     Math.round(totalPoints * 10) / 10,
      percentage:      Math.max(0, percentage), // floor at 0
      performance,
      qualified:       c.totalSessions >= MIN_SESSIONS,
    };

    if (c.totalSessions >= MIN_SESSIONS) {
      qualified.push(entry);
    } else {
      notEnough.push(entry);
    }
  });

  // ── SORT ──────────────────────────────────────────────────────────
  // Qualified: by percentage desc, then totalSessions desc as tiebreaker
  qualified.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return b.totalSessions - a.totalSessions;
  });

  // Not enough: by totalSessions desc so closest to threshold shows first
  notEnough.sort((a, b) => b.totalSessions - a.totalSessions);

  return ContentService
    .createTextOutput(JSON.stringify({
      cycleStart,
      cycleEnd,
      minSessions: MIN_SESSIONS,
      data: [...qualified, ...notEnough]
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
