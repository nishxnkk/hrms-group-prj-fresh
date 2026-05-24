# Deploy Backend to Render

This guide walks through deploying the Backend as a persistent web service on Render (supports WebSockets and long-lived processes).

1. Push your changes to GitHub.
2. Go to https://dashboard.render.com and click **New** → **Web Service**.
3. Connect your GitHub repo and choose the `Backend/` folder.
4. Choose **Docker** (recommended if you added `Backend/Dockerfile`) or use the Node build steps:
   - If Docker: Render will build the Dockerfile. Set the **Dockerfile Path** to `Backend/Dockerfile`.
   - If not Docker: Set the Build Command to `npm install` and Start Command to `npm start`.
5. Add Environment Variables (Render dashboard → Environment):
   - `DATABASE_URL` (your Postgres connection string)
   - `JWT_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `FROM_EMAIL` (optional)
   - `NODE_ENV=production`
   - `FRONTEND_ORIGIN` — set to your deployed frontend URL (e.g., `https://hrms11m123.netlify.app`) so the backend will accept connections (CORS + Socket.io).

Note: For local development, FRONTEND_ORIGIN can be `http://localhost:5173` (Vite dev server).
6. (Optional) Add a Managed Postgres on Render and use its connection string for `DATABASE_URL`.
7. Deploy and monitor logs in the Render dashboard.

Notes & Tips
- Socket.io will work on Render because it supports long-lived processes.
- If you previously tried to run on Vercel, remember the serverless limitations (cold starts, no reliable sockets).
- If the app cannot connect to Postgres, confirm `DATABASE_URL` has the correct credentials and that the DB allows connections from Render.

If you want, I can also: create the Render service for you (if you give Render access), or run a local Docker build to verify the image builds successfully.
