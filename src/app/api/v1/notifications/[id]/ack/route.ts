import { z } from "zod";

import { ackNotification, isRazan } from "@/lib/notifications";

const NO_STORE = { "Cache-Control": "no-store" };

const Ack = z.discriminatedUnion("status", [
  z.object({ status: z.literal("sent") }),
  z.object({ status: z.literal("failed"), error: z.string().trim().min(1).max(500) }),
]);

/** رزان تؤكد الإرسال أو الفشل: POST /api/v1/notifications/{id}/ack */
export async function POST(request: Request, ctx: RouteContext<"/api/v1/notifications/[id]/ack">) {
  if (!isRazan(request)) return new Response(null, { status: 401, headers: NO_STORE });
  const { id } = await ctx.params;
  if (!/^\d{1,18}$/.test(id))
    return Response.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  const body = Ack.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid body" }, { status: 400, headers: NO_STORE });
  if (!(await ackNotification(Number(id), body.data))) {
    return Response.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  }
  return Response.json({ ok: true }, { headers: NO_STORE });
}
