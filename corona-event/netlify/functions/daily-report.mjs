// 매일 오전 9시(한국 시간)에 운영자 메일로 랭킹을 보낸다
import { sendReport } from "../lib/report.mjs";

export default async () => {
  const r = await sendReport();
  console.log("daily report", JSON.stringify(r));
};

export const config = { schedule: "0 0 * * *" };
