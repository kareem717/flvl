import { j,  accountProcedure, userProcedure } from "../jstack"
import { CreateAccountParamsSchema } from "@/lib/db/validators"
import { HTTPException } from "hono/http-exception"

export const authRouter = j.router({
  getAccountByUserId: accountProcedure.query(async ({ c, ctx }) => {
    const { service, userId } = ctx

    const account = await service.auth.getAccountByUserId(userId)

    if (!account) {
      throw new HTTPException(404, {
        message: "Account not found",
      })
    }

    return c.json(account)
  }),

  createAccount: userProcedure
    .input(CreateAccountParamsSchema)
    .mutation(async ({ ctx, c, input }) => {
      const { service, userId } = ctx

      try {
        const account = await service.auth.createAccount({
          ...input,
          userId,
        })

        return c.json(account)
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to create account",
          cause: error,
        })
      }
    }),

})