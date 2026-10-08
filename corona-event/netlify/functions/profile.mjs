// 로그인한 참가자의 덱·프리셋·영웅을 서버에 저장하고 불러온다 (다른 기기에서도 같은 데이터)
import { store, json, bad, readBody, auth } from "../lib/event.mjs";

const okKey = (k) => typeof k === "string" && /^[a-z_0-9]{1,24}$/.test(k);
const cleanDeck = (d) => (Array.isArray(d) ? d.filter(okKey).slice(0, 60) : []);

export default async (req) => {
  if (req.method !== "POST") return bad("POST 요청만 받습니다.", 405);
  const b = await readBody(req);
  const a = await auth(b);
  if (a.err) return a.err;
  const p = a.p;
  if (b.save && typeof b.save === "object") {
    const s = b.save, prof = p.profile || {};
    if (Array.isArray(s.slots)) prof.slots = s.slots.slice(0, 3).map((x, i) => ({
      name: String((x && x.name) || `프리셋 ${i + 1}`).slice(0, 16), deck: cleanDeck(x && x.deck) }));
    if (Array.isArray(s.deck)) prof.deck = cleanDeck(s.deck);
    if (typeof s.hero === "string" && /^[a-z]{2,10}$/.test(s.hero)) prof.hero = s.hero;
    if (typeof s.active === "number") prof.active = Math.max(-1, Math.min(2, s.active | 0));
    prof.updatedAt = new Date().toISOString();
    p.profile = prof;
    await store().setJSON(a.key, p);
  }
  return json({ ok: true, profile: p.profile || null });
};

export const config = { path: "/api/profile" };
