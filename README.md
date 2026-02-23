# Agency Tracker

A full-stack agency management application for tracking clients, campaigns, time entries, and team performance.

## Features

- **Role-based access control**: Super Admin, Manager, Worker, Client
- **Client hierarchy**: Clients → Accounts → Websites → Campaigns
- **Time tracking**: Workers log hours against campaigns; cascading dropdowns guide selection
- **Change log**: Manual notes and automated entries for campaign status changes
- **Reports**: Hours by employee, client, and campaign
- **Notifications**: In-app notifications with bell indicator
- **Client portal**: Clients see their own hours, campaigns, team, and change log
- **User management**: Invite users via email with role assignment
- **Google OAuth**: Internal users can sign in with Google
- **Image uploads**: Agency logo, client logos, user avatars (stored on Railway Volume)
- **Password reset**: Email-based password reset flow

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Railway managed) |
| Auth | JWT + Passport.js (Google OAuth 2.0) |
| Email | Nodemailer + Gmail SMTP |
| File Storage | Railway Volume (local filesystem) |
| Deployment | Railway (Docker) |

## Roles

| Role | Permissions |
|------|-------------|
| `super_admin` | Full access: manage users, clients, settings, view all reports, change log |
| `manager` | View/edit clients, accounts, websites, campaigns; view reports |
| `worker` | Log time entries; view own hours |
| `client` | Client portal only: view own hours, campaigns, team, change log |

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-provided by Railway) |
| `JWT_SECRET` | Random 64-char hex string for JWT signing |
| `FRONTEND_URL` | Frontend URL (e.g. `https://your-app.railway.app`) |

### Optional (for full functionality)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password |
| `UPLOADS_PATH` | Path for file uploads (default: `/app/uploads`) |
| `UPLOADS_BASE_URL` | Base URL for serving uploaded files |

## Railway Deployment

### 1. Create a new Railway project

```bash
railway login
railway init
```

### 2. Add a PostgreSQL database

In the Railway dashboard, add a PostgreSQL service. The `DATABASE_URL` variable will be automatically injected.

### 3. Add a Volume (for file uploads)

In Railway dashboard → your service → Volumes → Add Volume:
- Mount path: `/app/uploads`

### 4. Set environment variables

In Railway dashboard → your service → Variables, add all required environment variables from `.env.example`.

### 5. Deploy

Push to the connected GitHub repository. Railway will automatically build and deploy using the `Dockerfile`.

### 6. Run database migrations

After first deploy, open a Railway shell and run:

```bash
node src/db/migrate.js
node src/db/seed.js
```

This creates the schema and the initial Super Admin user.

**Default credentials:**
- Email: `admin@agency.com` (or `SEED_ADMIN_EMAIL` env var)
- Password: `Admin@123456` (or `SEED_ADMIN_PASSWORD` env var)

> **Important:** Change the admin password immediately after first login.

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
node src/db/migrate.js
node src/db/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend dev server proxies API requests to `http://localhost:3001`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Email/password login |
| GET | `/api/v1/auth/google` | Initiate Google OAuth |
| POST | `/api/v1/auth/invite` | Invite a new user |
| POST | `/api/v1/auth/accept-invite` | Accept invite & set password |
| POST | `/api/v1/auth/forgot-password` | Request password reset email |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| GET | `/api/v1/clients` | List clients |
| POST | `/api/v1/clients` | Create client |
| GET | `/api/v1/clients/:id/accounts` | List accounts for client |
| GET | `/api/v1/accounts/:id/websites` | List websites for account |
| GET | `/api/v1/websites/:id/campaigns` | List campaigns for website |
| GET | `/api/v1/campaigns` | List all campaigns (scoped by role) |
| GET | `/api/v1/time-entries` | List time entries (scoped by role) |
| POST | `/api/v1/time-entries` | Log a time entry |
| GET | `/api/v1/reports/hours-by-employee` | Report: hours by employee |
| GET | `/api/v1/reports/hours-by-client` | Report: hours by client |
| GET | `/api/v1/reports/hours-by-campaign` | Report: hours by campaign |
| GET | `/api/v1/change-log` | List change log entries |
| POST | `/api/v1/change-log` | Add manual change log entry |
| GET | `/api/v1/notifications` | Get user notifications |
| POST | `/api/v1/upload/agency-logo` | Upload agency logo |
| POST | `/api/v1/upload/avatar` | Upload user avatar |
