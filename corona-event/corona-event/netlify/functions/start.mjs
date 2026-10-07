// 이벤트 대전 시작: 일회용 대전 번호를 발급한다
import { store, json, bad, readBody, auth, eventOpen } from "../lib/event.mjs";

export default async (req) => {
  if (req.method !== "POST") return bad("POST 요청만 받습니다.", 405);
  if (!eventOpen()) return bad("이벤트가 종료되었습니다.", 410);
  const b = await readBody(req);
  const a = await auth(b);
  if (a.err) return a.err;
  const mode = b.mode === "eveasy" ? "eveasy" : "evhard";
  a.p.match = { id: crypto.randomUUID(), startedAt: Date.now(), mode };
  await store().setJSON(a.key, a.p);
  return json({ ok: true, matchId: a.p.match.id, mode });
};

export const config = { path: "/api/start" };
