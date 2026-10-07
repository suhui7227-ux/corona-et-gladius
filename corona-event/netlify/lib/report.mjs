// 운영자에게 보내는 랭킹 메일 (Resend 사용)
import { allPlayers, ranked, kstDay, kstTime } from "./event.mjs";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function sendReport() {
  const key = process.env.RESEND_API_KEY, to = process.env.REPORT_TO;
  if (!key || !to) return { ok: false, error: "RESEND_API_KEY 또는 REPORT_TO 환경 변수가 없습니다." };
  const all = await allPlayers();
  const board = ranked(all);
  const rows = board.map((p, i) =>
    `<tr><td>${i + 1}</td><td>${esc(p.email)}</td><td style="text-align:right">${p.score}</td><td style="text-align:right">${p.wins}</td><td style="text-align:right">${p.best}</td><td>${kstTime(p.lastWinAt)}</td></tr>`).join("");
  const html = `<div style="font-family:sans-serif">
    <h2>Corona et Gladius 이벤트 랭킹 (${kstDay()} 기준)</h2>
    <p>등록 참가자 ${all.length}명 · 승리 기록이 있는 참가자 ${board.length}명</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr style="background:#f1e2b8"><th>순위</th><th>메일 주소</th><th>총점</th><th>승리</th><th>최고 점수</th><th>최근 승리(한국 시간)</th></tr>
      ${rows || '<tr><td colspan="6">아직 승리 기록이 없습니다.</td></tr>'}
    </table></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.REPORT_FROM || "Corona et Gladius <onboarding@resend.dev>",
      to: [to], subject: `[Corona et Gladius] 이벤트 랭킹 ${kstDay()}`, html,
    }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, detail: text.slice(0, 300) };
}
