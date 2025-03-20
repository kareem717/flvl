"use server"

import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

export const getTokenCached = cache(async () => {
  const { getToken } = await auth();
  const token = await getToken()

  return token
})