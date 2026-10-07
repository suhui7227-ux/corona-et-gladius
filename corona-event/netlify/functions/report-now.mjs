// 시험용: /api/report-now?key=비밀값 으로 열면 랭킹 메일을 바로 보낸다
import { json, bad } from "../lib/event.mjs";
import { sendReport } from "../lib/report.mjs";

export default async (req) => {
  const secret = process.env.REPORT_SECRET;
  const url = new URL(req.url);
  if (!secret || url.searchParams.get("key") !== secret) return bad("권한이 없습니다.", 403);
  return json(await sendReport());
};

export const config = { path: "/api/report-now" };
