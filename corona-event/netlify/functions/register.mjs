// 이벤트 참가 등록: 메일 주소로 참가자를 만들고 이 기기용 토큰을 돌려준다
import { store, json, bad, keyFor, normEmail, validEmail, mask, readBody, eventOpen, SETTINGS } from "../lib/event.mjs";

export default async (req) => {
  if (req.method !== "POST") return bad("POST 요청만 받습니다.", 405);
  if (!eventOpen()) return bad("이벤트가 종료되었습니다.", 410);
  const b = await readBody(req);
  const email = normEmail(b.email);
  if (!validEmail(email)) return bad("메일 주소 형식이 올바르지 않습니다.");
  if (b.agree !== true) return bad("개인정보 수집·이용에 동의해야 참가할 수 있습니다.");
  const s = store();
  const key = await keyFor(email);
  const ex = await s.get(key, { type: "json" });
  if (ex) {
    if (b.token && b.token === ex.token) return json({ ok: true, token: ex.token, masked: ex.masked, score: ex.score, wins: ex.wins });
    return bad("이미 등록된 메일 주소입니다. 처음 등록한 기기와 브라우저에서 참가해 주세요.", 409);
  }
  const { blobs } = await s.list({ prefix: "p_" });
  if (blobs.length >= SETTINGS.maxPlayers) return bad("참가 인원이 가득 찼습니다.", 429);
  const p = {
    email, masked: mask(email), token: crypto.randomUUID(),
    score: 0, wins: 0, best: 0, createdAt: new Date().toISOString(),
    lastWinAt: null, day: "", dayWins: 0, match: null,
  };
  await s.setJSON(key, p);
  return json({ ok: true, token: p.token, masked: p.masked, score: 0, wins: 0 });
};

export const config = { path: "/api/register" };
