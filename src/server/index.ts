import { j } from "./jstack"
import { authRouter } from "./handlers/auth-handler"
import { accountingHandler } from "./handlers/accounting-handler"
import { companyRouter } from "./handlers/company-handler"
import { webhookRouter } from "./handlers/webhook-handler"
import { cors } from "hono/cors"

/**
 * This is your base API.
 * Here, you can handle errors, not-found responses, cors and more.
 *
 * @see https://jstack.app/docs/backend/app-router
 */
const api = j
  .router()
  .basePath("/api")
  .use(cors({
    origin: ["http://localhost:3000", "https://app.fundlevel.co", "*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "x-is-superjson"],
    credentials: true,
    exposeHeaders: ["*"],
  }))
  .onError(j.defaults.errorHandler)

/**
 * This is the main router for your server.
 * All routers in /server/routers should be added here manually.
 */
const appRouter = j.mergeRouters(api, {
  auth: authRouter,
  company: companyRouter,
  accounting: accountingHandler,
  webhooks: webhookRouter,
})

export type AppRouter = typeof appRouter

export default appRouter
