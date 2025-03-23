const appRoot = "/";
export const companyRoot = "/company";

// Helper function moved to top for clarity
const companyPrefix = (id: number, path?: string) =>
  `${companyRoot}/${id}${path ? `/${path}` : ""}`;

export const redirects = {
  compliance: {
    privacy: "/privacy",
    terms: "/terms",
    eula: "/eula",
  },
  auth: {
    callback: (redirect?: string) =>
      redirect ? `/auth-callback?redirect=${redirect}` : "/auth-callback",
    login: "/login",
    logout: "/logout",
    afterLogout: "/login",
    afterLogin: appRoot,
    otp: (email?: string) => `/otp${email ? `?email=${email}` : ""}`,
    createAccount: "/create-account",
    error: (error: string) => `/auth-error?error=${error}`,
  },
  app: {
    company: (id: number) => ({
      root: companyPrefix(id),
      // reconciliation: companyPrefix(id, "reconciliation"),
      // bank: {
      //   root: companyPrefix(id, "bank"),
      //   reconciliation: companyPrefix(id, "bank/reconciliation"),
      //   transactions: (accountId: string) =>
      //     companyPrefix(id, `bank/${accountId}/transactions`),
      // },
      accounting: {
        invoices: companyPrefix(id, "invoices"),
        invoice: (invoiceId: string) =>
          companyPrefix(id, `invoices/${invoiceId}`),
        accounts: companyPrefix(id, "accounts"),
        account: (accountId: string) =>
          companyPrefix(id, `accounts/${accountId}`),
        transactions: companyPrefix(id, "transactions"),
        transaction: (transactionId: string) =>
          companyPrefix(id, `transactions/${transactionId}`),
        journalEntries: companyPrefix(id, "journal-entries"),
        journalEntry: (journalEntryId: string) =>
          companyPrefix(id, `journal-entries/${journalEntryId}`),
        vendorCredits: companyPrefix(id, "vendor-credits"),
        vendorCredit: (vendorCreditId: string) =>
          companyPrefix(id, `vendor-credits/${vendorCreditId}`),
        creditNotes: companyPrefix(id, "credit-notes"),
        creditNote: (creditNoteId: string) =>
          companyPrefix(id, `credit-notes/${creditNoteId}`),
        payments: companyPrefix(id, "payments"),
        payment: (paymentId: string) =>
          companyPrefix(id, `payments/${paymentId}`),
      },
      settings: {
        root: companyPrefix(id, "settings"),
        general: companyPrefix(id, "settings/general"),
        connections: companyPrefix(id, "settings/connections"),
      },
    }),
    root: appRoot,
  },
};
