import serverless from 'serverless-http'
import app from '../app.js'

// Wrap the Express app with serverless-http so Vercel can run it as a serverless function.
const handler = serverless(app)
export default handler
