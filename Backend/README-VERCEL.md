# Deploying Backend to Vercel (Serverless)

This project contains a monorepo with a `Backend/` Express app. Vercel deploys backend code as serverless functions. Important notes:

- WebSockets / long-lived Socket.io **will not work reliably** on Vercel. Use a separate host (Render, Railway) or a managed realtime provider (Pusher/Ably) for real-time features.

Steps to deploy the Backend on Vercel:

1. Push these changes to GitHub.
2. In Vercel dashboard, create a New Project → Import Git Repository.
3. Set the **Root Directory** to the repo root (you can also import the `Backend` folder as a separate project). The provided `vercel.json` maps all routes to the serverless wrapper at `Backend/api/index.js`.
4. Set Environment Variables in Vercel Project Settings (see `Backend/.env.example`):
   - `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `FROM_EMAIL`, etc.
5. Deploy. Monitor build logs — Vercel will build/install dependencies and deploy the function.

Caveats:
- Socket.io must be moved to a separate persistent host or replaced with a realtime service.
- Cold starts and execution-time limits apply.

If you'd like, I can:
- Move Socket.io to a Render/Railway service and update the frontend to connect there; or
- Create a Dockerfile for complete deployment to a Docker-friendly host (recommended for sockets).
