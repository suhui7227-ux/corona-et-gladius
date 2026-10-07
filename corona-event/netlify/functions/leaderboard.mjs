// 공개 랭킹: 메일 주소는 가린 형태로만 내보낸다. POST로 메일+토큰을 보내면 내 순위도 함께 준다.
import { json, readBody, auth, allPlayers, ranked, eventOpen, SETTINGS } from "../lib/event.mjs";

export default async (req) => {
  const board = ranked(await allPlayers());
  const top = board.slice(0, 50).map((p, i) => ({ rank: i + 1, name: p.masked, score: p.score, wins: p.wins }));
  let me = null;
  if (req.method === "POST") {
    const a = await auth(await readBody(req));
    if (!a.err) {
      const i = board.findIndex((x) => x._key === a.key);
      me = { name: a.p.masked, score: a.p.score, wins: a.p.wins, rank: i >= 0 ? i + 1 : null };
    }
  }
  return json({ open: eventOpen(), endsAt: SETTINGS.endsAt || null, players: board.length, top, me });
};

export const config = { path: "/api/leaderboard" };
