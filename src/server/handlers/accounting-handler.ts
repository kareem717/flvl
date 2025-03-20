import { j,  accountProcedure, userProcedure } from "../jstack"
import { HTTPException } from "hono/http-exception"
import { intIdSchema, stringIdSchema } from "./shared"

//TODO: verify user has access to the company
export const accountingRouter = j.router({
  companyBankAccounts: accountProcedure.input(intIdSchema).query(async ({ c, ctx, input }) => {
    const { service, account } = ctx
      const company = await service.company.getById(input)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

    const bankAccounts = await service.accounting.getBankAccountsForCompany(company.id)

    return c.json(bankAccounts)
  }),
  getBankAccount: accountProcedure
    .input(stringIdSchema)
    .query(async ({ ctx, c, input }) => {
      const { service, account } = ctx
      const bankAccount = await service.accounting.getBankAccountDetails(input);

      const company = await service.company.getById(bankAccount.companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      return c.json(bankAccount);
    }),
  getTransactionsByBankAccountId: accountProcedure
    .input(stringIdSchema)
    .query(async ({ ctx, c, input }) => {
      const { service, account } = ctx
      const bankAccount = await service.accounting.getBankAccountDetails(input);

      const company = await service.company.getById(bankAccount.companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      const transactions = await service.accounting.getTransactionsByBankAccountId(bankAccount.remoteId);

      return c.json(transactions);
    }),
})