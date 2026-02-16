# Bus Tracking System

A real-time bus tracking system built with the MERN stack, featuring horizontal scalability with Redis, live GPS tracking via WebSockets, and PWA support.

## Features

- **Rider Module**: Track buses in real-time, set arrival reminders, find routes
- **Driver Module**: Broadcast GPS location, manage trips, offline support
- **Admin Module**: Manage users, routes, buses, view analytics

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 18 + TypeScript |
| State Management | Zustand |
| Maps | Leaflet + React-Leaflet + OpenStreetMap |
| Styling | Tailwind CSS |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB Atlas + Mongoose |
| Caching + Pub/Sub | Redis |
| Real-time | Socket.io + Redis Adapter |
| Auth | JWT + Google OAuth |
| Push Notifications | Firebase Cloud Messaging |
| SMS | Twilio |

## Project Structure

```
BusTrackingSystem/
├── client/          # React Frontend (PWA)
├── server/          # Express Backend
├── shared/          # Shared TypeScript types
└── package.json     # Root package with workspaces
```

## Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Redis instance (Upstash/Redis Cloud)
- Twilio account (for SMS)
- Firebase project (for push notifications)

## Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=...
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `client/` and `server/`
   - Fill in your credentials

3. **Run development servers**
   ```bash
   npm run dev
   ```

   This starts both client (port 5173) and server (port 5000) concurrently.

## API Documentation

See [API.md](./docs/API.md) for detailed endpoint documentation.

## License

MIT
