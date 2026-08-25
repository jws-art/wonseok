import { DailyReportSections } from "../types";

/**
 * High-quality local report synthesizer
 * Used as a zero-failure fallback when serverless / backend AI connection is unavailable
 * (e.g. static hosting on Vercel without GEMINI_API_KEY env or network outage).
 */
export function synthesizeLocalReport(
  clientName: string,
  date: string,
  sections: DailyReportSections
): string {
  const name = clientName || "이용자";
  const results: string[] = [];

  // 1. 입퇴소 (CheckInOut)
  const cio = sections.checkInOut;
  const cioParts: string[] = [];
  if (cio?.checkInTime && cio.checkInTime !== "선택 안 함") {
    cioParts.push(`${cio.checkInTime}경 입소함`);
  }
  if (cio?.presets && cio.presets.length > 0) {
    cioParts.push(cio.presets.join(". "));
  }
  if (cio?.checkOutTime && cio.checkOutTime !== "선택 안 함") {
    cioParts.push(`${cio.checkOutTime}경 퇴소함`);
  }
  if (cio?.memo && cio.memo.trim()) {
    cioParts.push(cio.memo.trim());
  }

  let cioText = cioParts.length > 0 
    ? cioParts.map(p => p.trim()).filter(Boolean).map(p => p.endsWith(".") ? p : p + ".").join(" ")
    : "보호자와 함께 정해진 일과에 맞춰 안전하게 입퇴소함.";
  results.push(`입퇴소 : ${cioText}`);

  // 2. 위생과 청결 (Hygiene)
  const hyg = sections.hygiene;
  const hygParts: string[] = [];
  if (hyg?.presets && hyg.presets.length > 0) {
    hygParts.push(hyg.presets.join(". "));
  }
  if (hyg?.memo && hyg.memo.trim()) {
    hygParts.push(hyg.memo.trim());
  }
  let hygText = hygParts.length > 0
    ? hygParts.map(p => p.trim()).filter(Boolean).map(p => p.endsWith(".") ? p : p + ".").join(" ")
    : "손씻기 및 양치질 등 일상 위생 수칙을 양호하게 수행함.";
  results.push(`위생과 청결 : ${hygText}`);

  // 3. 식생활 (Meals)
  const meal = sections.meals;
  const mealParts: string[] = [];
  if (meal?.presets && meal.presets.length > 0) {
    mealParts.push(meal.presets.join(". "));
  }
  if (meal?.memo && meal.memo.trim()) {
    mealParts.push(meal.memo.trim());
  }
  let mealText = mealParts.length > 0
    ? mealParts.map(p => p.trim()).filter(Boolean).map(p => p.endsWith(".") ? p : p + ".").join(" ")
    : "제공된 식사를 편식 없이 골고루 섭취하며 원활히 식사를 마침.";
  results.push(`식생활 : ${mealText}`);

  // 4. 건강관리 (Health)
  const hlth = sections.health;
  const hlthParts: string[] = [];
  if (hlth?.presets && hlth.presets.length > 0) {
    hlthParts.push(hlth.presets.join(". "));
  }
  if (hlth?.memo && hlth.memo.trim()) {
    hlthParts.push(hlth.memo.trim());
  }
  let hlthText = hlthParts.length > 0
    ? hlthParts.map(p => p.trim()).filter(Boolean).map(p => p.endsWith(".") ? p : p + ".").join(" ")
    : "특이 징후 없이 양호한 컨디션을 유지하며 건강하게 하루를 보냄.";
  results.push(`건강관리 : ${hlthText}`);

  // 5. 프로그램 (Programs)
  const prog = sections.programs;
  const progParts: string[] = [];
  const ams: string[] = [];
  if (prog?.amProgram1 && prog.amProgram1 !== "선택 안 함") ams.push(prog.amProgram1);
  if (prog?.amProgram2 && prog.amProgram2 !== "선택 안 함") ams.push(prog.amProgram2);

  const pms: string[] = [];
  if (prog?.pmProgram1 && prog.pmProgram1 !== "선택 안 함") pms.push(prog.pmProgram1);
  if (prog?.pmProgram2 && prog.pmProgram2 !== "선택 안 함") pms.push(prog.pmProgram2);

  if (ams.length > 0) {
    progParts.push(`오전에는 ${ams.join(", ")} 활동에 참여함`);
  }
  if (pms.length > 0) {
    progParts.push(`오후에는 ${pms.join(", ")} 활동을 수행함`);
  }
  if (prog?.presets && prog.presets.length > 0) {
    progParts.push(prog.presets.join(". "));
  }
  if (prog?.memo && prog.memo.trim()) {
    progParts.push(prog.memo.trim());
  }

  let progText = progParts.length > 0
    ? progParts.map(p => p.trim()).filter(Boolean).map(p => p.endsWith(".") ? p : p + ".").join(" ")
    : "금일 예정된 일과 프로그램에 성실하고 적극적으로 참여함.";
  results.push(`프로그램 : ${progText}`);

  // 6. 기타사항 (Other)
  const oth = sections.other;
  const isNoneOther = !oth || 
    (oth.presets.length === 0 && (!oth.memo || !oth.memo.trim() || oth.memo.trim() === "없음")) ||
    oth.presets.includes("특별한 특이사항 없이 안전하게 하루 일과를 보냄");

  if (isNoneOther) {
    results.push("기타사항 : 없음");
  } else {
    const othParts: string[] = [];
    if (oth.presets && oth.presets.length > 0) {
      othParts.push(oth.presets.join(". "));
    }
    if (oth.memo && oth.memo.trim()) {
      othParts.push(oth.memo.trim());
    }
    const othText = othParts.map(p => p.trim()).filter(Boolean).map(p => p.endsWith(".") ? p : p + ".").join(" ");
    results.push(`기타사항 : ${othText || "없음"}`);
  }

  return results.join("\n");
}
