# 🛡️ Threat Ops — Insider Threat Detection Portal

A system that watches privileged accounts (DBAs, sysadmins), learns their normal behavior, flags anomalies, and lets a security team investigate and report on them.

> **Note:** Right now, privileged user activity (logs) is **simulated** using a "Simulate New Activity" button for demo purposes. In a real deployment, this data would come automatically from actual servers/databases streaming logs in — no manual button needed.

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT (auth), bcryptjs (password hashing)
**Frontend:** React (Vite), Tailwind CSS, Axios, React Router

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally or a free MongoDB Atlas cluster

### Setup
```bash
# Backend
cd backend
npm install
# create a .env file (copy .env.example) with MONGODB_URI, JWT_SECRET, PORT
node server.js

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The backend automatically creates demo accounts and seeds ~150 sample activity logs the first time it runs — nothing manual needed to start testing.

---

## Login Accounts

| Email | Password | Role |
|---|---|---|
| `admin@demo.com` | `admin123` | Admin |
| `analyst@demo.com` | `analyst123` | Analyst |

---

## 🔴 Admin — What to Test

Log in with `admin@demo.com`. Admin can see and do everything below, plus manage user accounts.

### 1. Privileged Activity Logs (navbar → "Privileged Activity Logs")
- You'll see a table already full of historical activity for the monitored accounts (Raj DBA, Neha SysAdmin)
- Click **"Simulate New Activity"** → a new log row appears instantly at the top with a highlight animation
- Try the filters (by user, by action type) to confirm the table updates

### 2. Baselines (navbar → "Baselines")
- Click **"Rebuild All Baselines"**
- Cards appear for each monitored user showing their learned "normal" behavior — typical hours, typical IPs, typical actions, average data volume

### 3. Alerts (navbar → "Alerts")
- Click **"Rescore All Historical Logs"** (admin-only button) → alerts appear for the unusual activity in the seeded data, each with a plain-English reason (e.g. "Activity outside typical hours", "Data volume significantly above normal")
- Go back to Logs, click "Simulate New Activity" a few times until one triggers a new alert live
- On any alert, try **Acknowledge** (means "seen, taking ownership") or **Dismiss** (means "reviewed, not a real threat")

### 4. Cases (navbar → "Cases")
- On an alert, click **"Open Case"** → a case card appears on the Cases board in the "Open" column
- Click the case card → add an investigation note → change its status (Open → Investigating → Resolved) → confirm the card moves columns live
- When marking it "Resolved," fill in a resolution summary

### 5. Reports (navbar → "Reports")
- Summary stats should load automatically (total logs, alerts by severity, cases by status, top risky users)
- Pick a date range, choose CSV or JSON, click **"Export Report"** → confirm a file downloads

### 6. Manage Users (navbar → "Manage Users", admin-only)
- View the list of all accounts
- Click **"Add User"** → create a new account (choose role: admin/analyst/auditor, and optionally mark it as a "privileged/monitored" account)

---

## 🟡 Analyst — What to Test

Log in with `analyst@demo.com`. This is the day-to-day operational role — same core detection/investigation tools as admin, minus account management and the bulk rescore action.

### 1. Privileged Activity Logs
- Same as admin: view the log table, filter it, click "Simulate New Activity" to generate a live event

### 2. Baselines
- Can view and rebuild baselines the same way as admin

### 3. Alerts
- Can view, filter, **Acknowledge**, and **Dismiss** alerts
- Cannot click "Rescore All Historical Logs" — that's admin-only

### 4. Cases (this is the analyst's main job)
- Open a case from any alert, add investigation notes, move it through Open → Investigating → Resolved/Escalated
- This is the core workflow an analyst would use every day — alert comes in, they investigate, they close it out

### 5. Reports
- Not the analyst's focus — this is for admin/auditor roles

### 6. Manage Users
- No access — analysts can't create or manage accounts

---

## Full Demo Flow (Admin or Analyst)

1. Log in
2. Go to **Logs** → simulate a couple of activity events
3. Go to **Baselines** → rebuild them
4. Go to **Alerts** → rescore all (admin) or just review existing ones → simulate more logs until one gets flagged live
5. Go to **Cases** → open a case from a flagged alert → add a note → resolve it
6. Go to **Reports** (admin) → export the audit trail

That's the whole loop: activity → detection → investigation → resolution → report.

---

## Future Plans

- **Real log ingestion:** Replace the "Simulate New Activity" button with actual agents/connectors pulling live logs from real servers, databases, SSH sessions, and cloud IAM activity — no manual simulation needed
- **Smarter anomaly detection:** Move from rule-based scoring to a proper ML model (e.g. Isolation Forest or an autoencoder) trained on larger historical datasets for more accurate baselines and fewer false positives
- **Auditor role UI:** Build out a dedicated, fully permissioned Auditor experience (currently only lightly covered) with read-only views across logs/alerts/cases plus their existing Reports access
- **Notifications:** Real-time alerts pushed via email/Slack/Teams when a high or critical severity event is flagged, instead of only showing up on the dashboard
- **Multi-org support:** Support multiple organizations/tenants on the same platform, each with isolated users, logs, and baselines
- **Session & security hardening:** Refresh tokens, account lockout after failed logins, audit logging of admin actions (who created/deleted which user, etc.)
- **Custom detection rules:** Let admins define their own thresholds/rules per user or user group instead of only the built-in scoring logic
- **Mobile-friendly dashboard:** Responsive layout so analysts can review and acknowledge alerts from a phone during on-call hours