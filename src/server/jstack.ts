import { InferMiddlewareOutput, jstack } from "jstack"
import { HTTPException } from "hono/http-exception"
import { createClerkClient } from "@clerk/backend"
import { verifyToken } from "@clerk/backend"
import { getCookie } from "hono/cookie"
import { db } from "@/lib/db/client"
import { Service } from "./service"
import { Storage } from "./storage"

interface Env {
  Bindings: {
    DATABASE_URL: string,
    QUICK_BOOKS_CLIENT_ID: string,
    QUICK_BOOKS_CLIENT_SECRET: string,
    QUICK_BOOKS_REDIRECT_URI: string,
    QUICK_BOOKS_ENVIRONMENT: "sandbox" | "production",
    PLAID_CLIENT_ID: string,
    PLAID_SECRET: string,
    PLAID_WEBHOOK_URL: string,
    PLAID_ENVIRONMENT: "sandbox" | "production",
    OPENAI_KEY: string,
    CLERK_SECRET_KEY: string,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string,
    CLERK_PUBLIC_JWT_KEY: string,
    NEXT_PUBLIC_APP_URL: string,
    QUICK_BOOKS_WEBHOOK_VERIFIER_TOKEN: string,
  }
}

export const j = jstack.init<Env>()


export const withServices = j.middleware(async ({ c, next }) => {
  console.log(c.env.QUICK_BOOKS_CLIENT_ID)
  const qbConfig = {
    clientId: c.env.QUICK_BOOKS_CLIENT_ID,
    clientSecret: c.env.QUICK_BOOKS_CLIENT_SECRET,
    redirectUri: c.env.QUICK_BOOKS_REDIRECT_URI,
    environment: c.env.QUICK_BOOKS_ENVIRONMENT,
  }
  const plaidConfig = {
    clientId: c.env.PLAID_CLIENT_ID,
    secret: c.env.PLAID_SECRET,
    webhookUrl: c.env.PLAID_WEBHOOK_URL,
    environment: c.env.PLAID_ENVIRONMENT,
  }

  const storage = new Storage(db(c.env.DATABASE_URL))
  const service = new Service(storage, qbConfig, plaidConfig, c.env.OPENAI_KEY)

  return await next({ service })
})

type WithServiceMiddlewareOutput = InferMiddlewareOutput<typeof withServices>

export const withUser = j.middleware(async ({ c, next, ctx }) => {
  const cookies = getCookie(c);
  const sessionCookie = cookies["__session"];
  const authorization = c.req.header("Authorization")?.replace("Bearer ", "");

  const token = sessionCookie || authorization;
  const clerkClient = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });

  if (!token) {
    throw new HTTPException(401, {
      message: "Unauthorized, no session token. Please sign in.",
    });
  }

  try {
    const verifiedToken = await verifyToken(token, {
      jwtKey: c.env.CLERK_PUBLIC_JWT_KEY,
      secretKey: c.env.CLERK_SECRET_KEY,
      clockSkewInMs: 120000,
      authorizedParties: [
        c.env.NEXT_PUBLIC_APP_URL,
      ],
    });

    const session = await clerkClient.sessions.getSession(verifiedToken.sid);

    if (!session || !session.userId) {
      throw new HTTPException(401, {
        message: "Unauthorized, sign in to continue.",
      });
    }

    return await next({ verifiedToken, userId: session.userId })
  } catch (error) {
    console.log(error);
    throw new HTTPException(500, {
      message: "Something went wrong please try again.",
    });
  }

})

type WithUserMiddlewareOutput = InferMiddlewareOutput<typeof withUser>

export const withAccount = j.middleware(async ({ c, next, ctx }) => {
  const { service, userId } = ctx as (WithUserMiddlewareOutput & WithServiceMiddlewareOutput)

  const account = await service.auth.getAccountByUserId(userId)

  if (!account) {
    throw new HTTPException(401, {
      message: "Unauthorized, create an account to continue.",
    })
  }

  return await next({ userId, account })
})


/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const publicProcedure = j.procedure.use(withServices)
export const userProcedure = publicProcedure.use(withUser)
export const accountProcedure = userProcedure.use(withAccount)

