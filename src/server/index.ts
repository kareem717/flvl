import { j } from "./jstack"
import { authRouter } from "./handlers/auth-handler"
import { accountingRouter } from "./handlers/accounting-handler"
import { companyRouter } from "./handlers/company-handler"
import { webhookRouter } from "./handlers/webhook-handler"
/**
 * This is your base API.
 * Here, you can handle errors, not-found responses, cors and more.
 *
 * @see https://jstack.app/docs/backend/app-router
 */
const api = j
  .router()
  .basePath("/api")
  .use(j.defaults.cors)
  .onError(j.defaults.errorHandler)

/**
 * This is the main router for your server.
 * All routers in /server/routers should be added here manually.
 */
const appRouter = j.mergeRouters(api, {
  auth: authRouter,
  company: companyRouter,
  accounting: accountingRouter,
  webhooks: webhookRouter,
})

export type AppRouter = typeof appRouter

export default appRouter
