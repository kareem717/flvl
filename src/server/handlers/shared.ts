import { z } from "zod"

export const intIdSchema = z.number().int().positive()

export const stringIdSchema = z.string().min(1)