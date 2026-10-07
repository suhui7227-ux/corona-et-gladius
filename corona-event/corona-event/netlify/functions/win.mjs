// 이벤트 승리 기록: 남은 체력과 덱에 남은 카드 수로 점수를 더한다
import { store, json, bad, readBody, auth, eventOpen, score, kstDay, SETTINGS, allPlayers, ranked } from "../lib/event.mjs";

export default async (req) => {
  if (req.method !== "POST") return bad("POST 요청만 받습니다.", 405);
  if (!eventOpen()) return bad("이벤트가 종료되었습니다.", 410);
  const b = await readBody(req);
  const a = await auth(b);
  if (a.err) return a.err;
  const p = a.p;
  if (!p.match || b.matchId !== p.match.id) return bad("유효하지 않은 대전입니다. 새 대전을 시작해 주세요.", 409);
  if (Date.now() - p.match.startedAt < SETTINGS.minMatchMs) return bad("대전 시간이 너무 짧아 기록하지 않았습니다.", 422);
  const hp = Math.floor(Number(b.hp)), deckLeft = Math.floor(Number(b.deckLeft));
  if (!(hp >= 1 && hp <= 200) || !(deckLeft >= 0 && deckLeft <= 47)) return bad("기록 값이 올바르지 않습니다.", 422);
  const today = kstDay();
  if (p.day !== today) { p.day = today; p.dayWins = 0; }
  if (p.dayWins >= SETTINGS.maxWinsPerDay) return bad("오늘 기록할 수 있는 승리 횟수를 모두 채웠습니다.", 429);
  const mode = p.match.mode === "eveasy" ? "eveasy" : "evhard";
  const gained = score(hp, deckLeft, mode);
  p.score += gained; p.wins += 1; p.dayWins += 1; p.best = Math.max(p.best, gained);
  p.lastWinAt = new Date().toISOString(); p.match = null;
  await store().setJSON(a.key, p);
  const board = ranked(await allPlayers());
  const rank = board.findIndex((x) => x._key === a.key) + 1;
  return json({ ok: true, gained, mode, score: p.score, wins: p.wins, rank, players: board.length });
};

export const config = { path: "/api/win" };
