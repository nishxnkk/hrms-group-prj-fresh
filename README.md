# RedNote PayRoll System

This repository contains two deployable apps:

- `Backend/` - Express, Socket.IO, and PostgreSQL API
- `Frontend/` - React/Vite frontend

## Local setup

Install dependencies from the repo root:

```bash
npm install
```

You can also install from the two app folders directly with `npm ci --prefix Backend` and `npm ci --prefix Frontend`.

Create environment files from the examples:

```bash
copy Backend\.env.example Backend\.env
copy Frontend\.env.example Frontend\.env
```

Start the backend:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev:frontend
```

## Required backend environment

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret used for signing auth tokens
- `FRONTEND_ORIGIN` - deployed frontend URL, for example `https://your-site.netlify.app`
- `PORT` - provided by most hosts automatically
- `NODE_ENV=production` - set by the backend host

Optional email variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `FROM_EMAIL`
- `CONTACT_TO`
- `FEEDBACK_TO`

## Deploy

Recommended deployment:

1. Deploy `Backend/` as a persistent Node web service on Render/Railway/Fly.io. Use `npm ci` as the build command and `npm start` as the start command, or deploy with `Backend/Dockerfile`.
2. Deploy `Frontend/` as a static site on Netlify/Vercel. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the publish directory.
3. Set frontend env `VITE_API_BASE` to the deployed backend URL.
4. Set backend env `FRONTEND_ORIGIN` to the deployed frontend URL.
5. Confirm the backend health check returns `ok` at `/health`.

The frontend includes `Frontend/public/_redirects` for Netlify SPA routing.
