// 이벤트 서버 공통 도구: 저장소, 응답, 참가자 인증, 점수 계산
import { getStore } from "@netlify/blobs";

export const SETTINGS = {
  endsAt: process.env.EVENT_END || "",          // 예: 2026-11-30T23:59:59+09:00 (비우면 무기한)
  minMatchMs: 60 * 1000,                         // 이보다 짧은 대전의 승리는 기록하지 않음
  maxWinsPerDay: 40,                             // 하루(한국 시간) 기록 가능한 승리 수
  maxPlayers: 5000,
};

// 이벤트 모드별 점수 배율: 쉬움은 0.5배, 어려움은 2배
export const MODES = { eveasy: 0.5, evhard: 2 };
// 체력은 30까지만 점수로 인정 (회복으로 체력을 부풀린 뒤 끄는 점수 작업 방지)
export const HP_CAP = 30;
export const score = (hp, deckLeft, mode = "evhard") => Math.round((Math.min(hp, HP_CAP) * 10 + deckLeft * 5) * (MODES[mode] ?? 1));

export const store = () => getStore({ name: "corona-event", consistency: "strong" });

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
export const bad = (error, status = 400) => json({ error }, status);

export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const validEmail = (e) => e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export function mask(e) {
  const [u, d] = e.split("@");
  const head = u.length <= 2 ? u[0] : u.slice(0, 2);
  return head + "*".repeat(Math.min(5, Math.max(2, u.length - head.length))) + "@" + d;
}
export async function keyFor(email) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return "p_" + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}
export const eventOpen = () => !SETTINGS.endsAt || Date.now() < Date.parse(SETTINGS.endsAt);
export const kstDay = (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
export const kstTime = (iso) => (iso ? new Date(Date.parse(iso) + 9 * 3600e3).toISOString().replace("T", " ").slice(0, 16) : "-");

export async function readBody(req) {
  try { const b = await req.json(); return b && typeof b === "object" ? b : {}; } catch { return {}; }
}

// 메일 + 토큰이 맞는 참가자만 통과
export async function auth(b) {
  const email = normEmail(b.email);
  if (!validEmail(email)) return { err: bad("메일 주소 형식이 올바르지 않습니다.") };
  const key = await keyFor(email);
  const p = await store().get(key, { type: "json" });
  if (!p) return { err: bad("등록되지 않은 참가자입니다.", 404) };
  if (typeof b.token !== "string" || b.token !== p.token) return { err: bad("참가자 인증에 실패했습니다.", 403) };
  return { key, p };
}

export async function allPlayers() {
  const s = store();
  const { blobs } = await s.list({ prefix: "p_" });
  const list = await Promise.all(blobs.map((x) => s.get(x.key, { type: "json" })));
  return list.filter(Boolean).map((p, i) => ({ ...p, _key: blobs[i].key }));
}
export const ranked = (ps) =>
  ps.filter((p) => p.wins > 0).sort((a, b) => b.score - a.score || String(a.lastWinAt).localeCompare(String(b.lastWinAt)));
