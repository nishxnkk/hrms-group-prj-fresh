# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Backend URL configuration 🔧

The frontend will use the environment variable `VITE_API_BASE` as the API base URL. To point the frontend to the deployed backend on Render, create a `.env` file in the `Hr/` folder with:

```
VITE_API_BASE=https://hrms-group-prj.onrender.com
```

When `VITE_API_BASE` is not set, components fall back to `http://localhost:3000` for local development. This lets you run the frontend locally while targeting either localhost or the Render deployment.

## Netlify SPA routing fix 🔁
If you deploy this app to Netlify, refreshing on client-side routes can return a 404. To fix this, we include a `_redirects` file that rewrites all requests to `index.html` so the SPA router can handle the URL:

- File: `Hr/public/_redirects`
- Contents: `/* /index.html 200`

Netlify will copy this into the published site during build and handle client-side route refreshes correctly.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
