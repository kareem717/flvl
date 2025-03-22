import { CreateCompanyParamsSchema } from "@/lib/db/validators"
import { j, accountProcedure, publicProcedure } from "../jstack"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"
import { intIdSchema } from "./shared"

// Create enum for the sync job types that matches the SyncJobType
export const companyRouter = j.router({
  search: accountProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ ctx, c, input }) => {
      const { service, userId } = ctx
      const account = await service.auth.getAccountByUserId(userId)

      if (!account) {
        throw new HTTPException(401, {
          message: "Account not found"
        })
      }

      const searchQuery = input.query || ""
      const companies = await service.company.searchCompanies(searchQuery, account.id)
      return c.json(companies)
    }),

  create: accountProcedure
    .input(CreateCompanyParamsSchema)
    .mutation(async ({ ctx, c, input }) => {
      const { service, userId } = ctx
      const account = await service.auth.getAccountByUserId(userId)

      if (!account) {
        throw new HTTPException(401, {
          message: "Account not found"
        })
      }

      const company = await service.company.create(input, account.id)

      return c.json(company, 201)
    }),

  getByAccountId: accountProcedure
    .query(async ({ ctx, c }) => {
      const { service, account } = ctx
      const companies = await service.company.getByAccountId(account.id)

      return c.json(companies)
    }),

  createPlaidLinkToken: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .mutation(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const company = await service.company.getById(companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      const linkToken = await service.company.createPlaidLinkToken({
        companyId: company.id
      })

      return c.json({ linkToken })
    }),

  connectQuickBooks: accountProcedure
    .input(z.object({
      companyId: intIdSchema,
      redirectUrl: z.string()
    }))
    .mutation(async ({ ctx, c, input }) => {
      const { service, userId } = ctx
      const account = await service.auth.getAccountByUserId(userId)

      if (!account) {
        throw new HTTPException(401, {
          message: "Account not found"
        })
      }

      const url = await service.company.startQuickBooksOAuthFlow(
        input.companyId,
        input.redirectUrl
      )

      return c.json({ url })
    }),

  "quick-books-callback": publicProcedure
    .query(async ({ ctx, c }) => {
      const { realmId, code, state } = c.req.query()
      if (!realmId || !code || !state) {
        throw new HTTPException(400, {
          message: `Missing required parameters: ${!realmId ? "realmId" : ""} ${!code ? "code" : ""} ${!state ? "state" : ""}`
        })
      }

      const { service } = ctx
      const { redirect_url } = await service.company.completeQuickBooksOAuthFlow({ realmId, code, state })

      return c.redirect(redirect_url)
    }),

  getById: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx

      const company = await service.company.getById(companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this company"
        })
      }

      return c.json(company)
    }),

  deletePlaidCredentials: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .mutation(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx

      const company = await service.company.getById(companyId)
      if (!company) {
        throw new HTTPException(404, {
          message: "Linked account not found"
        })
      }

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      await service.company.deletePlaidCredentials(company.id)
    }),

  deleteCompany: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .mutation(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx

      if (!account) {
        throw new HTTPException(401, {
          message: "Account not found"
        })
      }

      const company = await service.company.getById(companyId)
      if (!company) {
        throw new HTTPException(404, {
          message: "Linked account not found"
        })
      }

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      await service.company.deleteCompany(company.id)
    }),

  swapPlaidPublicToken: accountProcedure
    .input(z.object({
      companyId: intIdSchema,
      publicToken: z.string()
    }))
    .mutation(async ({ ctx, c, input: { companyId, publicToken } }) => {
      const { service, account } = ctx
      const company = await service.company.getById(companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this company"
        })
      }

      const { companyId: recordCompanyId } = await service.company.createPlaidCredentials({
        companyId: company.id,
        publicToken
      })

      service.company.syncBankAccounts(recordCompanyId)
      service.company.syncBankTransactions(recordCompanyId)

      return c.status(204)
    }),
})