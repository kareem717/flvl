import { z } from "zod"
import { j, accountProcedure } from "../jstack"
import { stream } from "hono/streaming";

const chatSchema = z.object({
  companyId: z.number(),
  messages: z.array(z.object({
    content: z.string(),
    role: z.enum(["system", "user", "assistant", "data"]),
    id: z.string(),
  })),
  id: z.string(),
})

export const aiHandler = j.router({
  chat: accountProcedure.mutation(async ({ c, ctx, input }) => {
    const rawBody = await c.req.json()

    const parsedBody = chatSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return c.json({ error: "Invalid request body", details: parsedBody.error.errors }, 400)
    }

    const { service } = ctx

    // Mark the response as a v1 data stream:
    c.header("X-Vercel-AI-Data-Stream", "v1");
    c.header("Content-Type", "text/event-stream");

    const dataStream = await service.ai.chat(parsedBody.data.messages, parsedBody.data.companyId);

    return stream(c, (stream) => stream.pipe(dataStream));
  }),
})