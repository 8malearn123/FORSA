import { isRazan, pendingNotifications } from "@/lib/notifications";

const NO_STORE = { "Cache-Control": "no-store" };

/** رزان تسحب إشعارات الفريق المعلّقة: GET /api/v1/notifications?status=pending&limit=50 */
export async function GET(request: Request) {
  if (!isRazan(request)) return new Response(null, { status: 401, headers: NO_STORE });
  const params = new URL(request.url).searchParams;
  if ((params.get("status") ?? "pending") !== "pending") {
    return Response.json({ error: "status must be pending" }, { status: 400, headers: NO_STORE });
  }
  const limit = Math.min(Math.max(Math.trunc(Number(params.get("limit"))) || 50, 1), 100);
  return Response.json({ data: await pendingNotifications(limit) }, { headers: NO_STORE });
}
