// 이벤트 대전 시작: 일회용 대전 번호를 발급한다
import { store, json, bad, readBody, auth, eventOpen } from "../lib/event.mjs";

export default async (req) => {
  if (req.method !== "POST") return bad("POST 요청만 받습니다.", 405);
  if (!eventOpen()) return bad("이벤트가 종료되었습니다.", 410);
  const a = await auth(await readBody(req));
  if (a.err) return a.err;
  a.p.match = { id: crypto.randomUUID(), startedAt: Date.now() };
  await store().setJSON(a.key, a.p);
  return json({ ok: true, matchId: a.p.match.id });
};

export const config = { path: "/api/start" };
