# Coordinator Performance Dashboard

A real-time performance tracking dashboard built for **eYouth** to monitor and rank project coordinators based on cycle-based KPIs.

> **Status:** Project concluded. Kept live as documentation of the pointing system used during the DEPI Round 3 program.

---

## Overview

During the DEPI Round 3 program, coordinators were responsible for managing sessions across multiple groups. This dashboard aggregated their performance data from Google Sheets via a Google Apps Script API and displayed a live leaderboard with scoring breakdowns.

**Built with:** HTML · CSS · JavaScript · Bootstrap 5 · Chart.js · Google Apps Script

---

## How the Scoring Works

Each active session a coordinator handles is evaluated across 3 tasks:

| Task | On Time | Delayed | Not Done |
|---|---|---|---|
| Attendance | +1 | +1, −0.5 penalty | −1 penalty |
| Record | +1 | +1, −0.5 penalty | −1 penalty (online only) |
| Materials | +1 | +1, −0.5 penalty | −1 penalty |

**Extra penalties:**
- Reminder not sent 24hr before session → **−3**
- Caused or failed to report a problem → **−5**

**Final score:**
```
Score % = (Total Points − Penalties) / (Sessions × 3) × 100
```

**Performance levels:**

| Score | Level |
|---|---|
| 95%+ | Excellent |
| 75–94% | Good |
| 60–74% | Needs Improvement |
| < 60% | Weak |
| < 24 sessions | Not Enough Data |

---

## Ranking Rules

- Ranked by Score % descending
- Tiebreaker: more sessions = higher rank
- Minimum **24 active sessions** required to be ranked
- Coordinators below threshold appear at the bottom with a "Not Enough Data" badge

---

## Project Structure

```
├── index.html        # Main dashboard with leaderboard, charts, filters
├── tutorial.html     # Full documentation of the scoring system
├── PointingSystem.gs           # Google Apps Script backend (reads from Google Sheets Master sheet)
├── img/
│   ├── Logo.png      # company logo (favicon)
│   └── horizontal.png # company horizontal logo (tutorial hero)
└── README.md
```

---

## Data Notes

- Only rows with `Session Status = "Active"` are counted
- Empty Attendance/Records/Material cells are treated as "Not Done"
- The `Extra Penalties` column is optional — if present, values are summed per coordinator

---

## Built by

**Mohamed Ashraf Mattar** — Project Coordinator & .NET Software Engineer  
[LinkedIn](https://linkedin.com/in/momattar)

*Built during tenure as Project Coordinator at eyouth, Jul 2025*
