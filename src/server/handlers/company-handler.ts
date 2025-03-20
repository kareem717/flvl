import { CreateCompanyParamsSchema } from "@/lib/db/validators"
import { j, accountProcedure, publicProcedure } from "../jstack"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"
import { intIdSchema } from "./shared"

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
    .input(intIdSchema)
    .mutation(async ({ ctx, c, input }) => {
      const { service, account } = ctx
      const company = await service.company.getById(input)

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

  quickBooksCallback: publicProcedure
    .input(z.object({
      code: z.string(),
      state: z.string(),
      realmId: z.string()
    }))
    .mutation(async ({ ctx, c, input }) => {
      const { service } = ctx
      const { redirect_url, company_id } = await service.company.completeQuickBooksOAuthFlow(input)

      await service.company.syncQuickBooksInvoices(company_id)
      return c.redirect(redirect_url)
    }),

  getById: accountProcedure
    .input(intIdSchema)
    .query(async ({ ctx, c, input }) => {
      const { service, account } = ctx

      const company = await service.company.getById(input)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this company"
        })
      }

      return c.json(company)
    }),

  deletePlaidCredentials: accountProcedure
    .input(intIdSchema)
    .mutation(async ({ ctx, c, input }) => {
      const { service, account } = ctx

      const company = await service.company.getById(input)
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
    .input(intIdSchema)
    .mutation(async ({ ctx, c, input }) => {
      const { service, account } = ctx

      if (!account) {
        throw new HTTPException(401, {
          message: "Account not found"
        })
      }

      const company = await service.company.getById(input)
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
    .mutation(async ({ ctx, c, input }) => {
      const { service, account } = ctx
      const company = await service.company.getById(input.companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this company"
        })
      }

      const { itemId } = await service.company.createPlaidCredentials({
        companyId: company.id,
        publicToken: input.publicToken
      })

      await service.company.syncPlaidBankAccounts(itemId)
      await service.company.syncPlaidTransactions(itemId)

      return c.status(204)
    })
})