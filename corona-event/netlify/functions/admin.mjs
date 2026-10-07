// 운영자 전용: /api/admin?key=REPORT_SECRET값&action=...
//   action=delete&email=메일주소  → 그 참가자 기록 삭제
//   action=reset-score&email=메일주소 → 그 참가자 점수·승수만 0으로 (참가 정보는 유지)
//   action=reset-all&confirm=yes → 모든 참가자의 점수·승수를 0으로
import { store, json, bad, keyFor, normEmail, validEmail, allPlayers } from "../lib/event.mjs";

export default async (req) => {
  const url = new URL(req.url), q = (k) => url.searchParams.get(k) || "";
  const secret = process.env.REPORT_SECRET;
  if (!secret || q("key") !== secret) return bad("권한이 없습니다.", 403);
  const s = store(), action = q("action");
  if (action === "reset-all") {
    if (q("confirm") !== "yes") return bad("모든 점수를 지우려면 주소 끝에 &confirm=yes 를 붙이세요.");
    const ps = await allPlayers();
    for (const p of ps) { const { _key, ...rest } = p; await s.setJSON(_key, { ...rest, score: 0, wins: 0, best: 0, dayWins: 0, lastWinAt: null, match: null }); }
    return json({ ok: true, reset: ps.length });
  }
  const email = normEmail(q("email"));
  if (!validEmail(email)) return bad("email=메일주소 를 정확히 넣어 주세요.");
  const key = await keyFor(email), p = await s.get(key, { type: "json" });
  if (!p) return bad("그 메일로 등록된 참가자가 없습니다.", 404);
  if (action === "delete") { await s.delete(key); return json({ ok: true, deleted: email }); }
  if (action === "reset-score") { await s.setJSON(key, { ...p, score: 0, wins: 0, best: 0, dayWins: 0, lastWinAt: null, match: null }); return json({ ok: true, reset: email }); }
  return bad("action은 delete, reset-score, reset-all 중 하나여야 합니다.");
};

export const config = { path: "/api/admin" };
