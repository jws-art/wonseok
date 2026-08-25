import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function for generating reports
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { clientName, date, sections } = req.body || {};

    if (!sections) {
      return res.status(400).json({ error: "Sections data is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 프로젝트 Settings > Environment Variables에서 GEMINI_API_KEY를 추가해 주세요."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const prompt = `
당신은 사회복지관, 주간보호센터, 또는 어린이집에서 근무하는 사회복지사이자 생활지도 교사입니다.
제공된 단어(키워드), 선택된 체크박스 항목, 그리고 개별 메모를 가이드라인 삼아, 대상자(클라이언트/아동)에 대한 따뜻하고 전문적인 데일리 리포트(일일 관찰 기록)를 작성해주세요.

[중요 지침]
1. 아래 형식(카테고리 구분)을 엄격하게 지켜주세요.
2. 각 항목은 대상자의 행동을 상세하고 관찰에 입각한 어조로, 친절하고 부드러운 경어체(~함, ~하도록 지도함, ~함.)를 섞어가며 작성해주세요.
3. 입력되지 않은 항목이 있다면 형식은 유지하되 빈 상태로 두거나 간단히 "해당 사항 없음" 또는 양호하게 일상활동을 했다는 부드러운 한 문장으로 표현하세요.
4. 사용자 입력값에 문법이 어색하거나 파편화된 단어들이 있더라도, 자연스럽고 완성도 높은 문장으로 부드럽게 연결해주세요.
5. [★매우 중요 - 입퇴소 지침] 입퇴소 추가 메모를 따로 작성하지 않은 경우에는 '시설에 들어선 후 스스로 신발을 정리하고 교실로 이동했다' 혹은 '신발을 스스로 정리하도록 안내하고'와 같은, 보기에 명시되지 않은 구체적 가공 행위나 임의의 일상 안내 행동은 절대로 지어내거나 포함하지 마십시오. 오직 사용자가 직접 체크한 보기(키워드)와 선택/입력한 시간에만 정확히 충실하여 군더더기 없이 깔끔하고 간결하게 완성해야 합니다.
6. [★매우 중요 - 기타사항 없음] 기타사항 정보 카테고리에 '기타사항 없음'이 선택되어 있거나, 선택된 키워드/체크항목이 없거나 '없음'이고 추가 메모도 비어있거나 '없음'인 경우에는, 기타사항 섹션의 완성 결과물 텍스트를 무조건 "없음" 한 단어로만 채워서 출력해주세요. (예: '기타사항 : 없음'). 다른 부연 설명이나 가상의 내용, 일상 안부를 절대로 지어내지 마십시오.
7. [프로그램 지침] 오전 프로그램 1/2, 오후 프로그램 1/2이 각각 선택된 경우, 오전과 오후의 시간 흐름에 맞춰 해당 프로그램 활동에 참여했음을 서술하고 다른 프로그램 키워드 및 추가 메모 내용과 자연스러운 연결 문장으로 표현해 주세요. (예: 오전에는 [오전 프로그램 1/2]에 참여하고, 오후에는 [오후 프로그램 1/2] 활동을 무사히 수행함)
8. [문장 다양성 및 변주 지침 - ★매우 중요] 사용자가 동일하거나 유사한 키워드(체크항목)를 반복적으로 선택하더라도 매번 똑같은 문장으로 리포트가 출력되지 않도록 하십시오. 제공된 키워드의 핵심 사실과 의미는 100% 완전하게 반영 및 보존하되, 다양한 동의어, 유의어, 표현 방식, 문장 서술 순서, 서술어 어미 등을 활용하여 문장을 매번 새롭고 다양하게 재표현(Paraphrasing)하여 작성해 주십시오.

[원하기 출력 스타일 예시]
입퇴소 : 보호자와 함께 입퇴소 함. 10시경 입소함. 보호자와 17시경 퇴소 후 복지관 수영장이요함. 퇴소함. 신발과 옷정리를 스스로 할 수 있도록 도와 줌. 퇴소할 때 천천히 ‘안녕히 계세요’라고 말을 할 수 있도록 함.
위생과 청결 : 식사 전후로 손씻기 지도를 하였으며, 화장실 사용 후 손을 씻도록 지도함. 식사 후에 양치지도를 함. 
식생활 : 오늘 점심식사 음식에는 관심이 없었으며, 먹을 수 있도록 독려를 하였으나 먹지 않으려고 함. 다른 반찬을 조금 먹음.
건강관리 : 특별한 이상 징후 없이 양호한 하루를 보냈으며, 전반적인 컨디션이 매우 밝고 차분해 보임.
프로그램 : 자조모임(스포츠) 일상생활활동
기타사항 : 없음

[입력 데이터]
대상자 이름: ${clientName || '대상자'}
날짜: ${date || '오늘'}

- 입퇴소 정보:
  * 등원(입소) 시간: ${sections.checkInOut?.checkInTime || "선택 안 함"}
  * 하원(퇴소) 시간: ${sections.checkInOut?.checkOutTime || "선택 안 함"}
  * 키워드/체크항목: ${sections.checkInOut?.presets?.join(", ") || "없음"}
  * 추가 메모: ${sections.checkInOut?.memo || "없음"}

- 위생과 청결 정보:
  * 키워드/체크항목: ${sections.hygiene?.presets?.join(", ") || "없음"}
  * 추가 메모: ${sections.hygiene?.memo || "없음"}

- 식생활 정보:
  * 키워드/체크항목: ${sections.meals?.presets?.join(", ") || "없음"}
  * 추가 메모: ${sections.meals?.memo || "없음"}

- 건강관리 정보:
  * 키워드/체크항목: ${sections.health?.presets?.join(", ") || "없음"}
  * 추가 메모: ${sections.health?.memo || "없음"}

- 프로그램 정보:
  * 오전 프로그램 1: ${sections.programs?.amProgram1 || "선택 안 함"}
  * 오전 프로그램 2: ${sections.programs?.amProgram2 || "선택 안 함"}
  * 오후 프로그램 1: ${sections.programs?.pmProgram1 || "선택 안 함"}
  * 오후 프로그램 2: ${sections.programs?.pmProgram2 || "선택 안 함"}
  * 키워드/체크항목: ${sections.programs?.presets?.join(", ") || "없음"}
  * 추가 메모: ${sections.programs?.memo || "없음"}

- 기타사항 정보:
  * 키워드/체크항목: ${sections.other?.presets?.join(", ") || "없음"}
  * 추가 메모: ${sections.other?.memo || "없음"}

위의 카테고리별 정보를 기반으로 "입퇴소 : ", "위생과 청결 : ", "식생활 : ", "건강관리 : ", "프로그램 : ", "기타사항 : " 항목을 각각 채워서 보고서 완제품 텍스트를 출력해주세요. 추가 설명글이나 마크다운 백틱(\`\`\`) 등은 쓰지 말고, 오직 완성된 한글 리포트 텍스트만 출력해주세요.
`;

    // Attempt with gemini-3.7-flash, fallback to gemini-3.1-flash-lite on transient overload
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 1.0,
        }
      });
    } catch (err: any) {
      console.warn("Primary model error, attempting fallback to gemini-3.1-flash-lite:", err);
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 1.0,
        }
      });
    }

    let reportText = (response?.text || "").trim();

    // Force "기타사항 : 없음" if "기타사항 없음" preset is selected OR if other items are empty/none
    const hasOtherNonePreset = sections.other?.presets?.includes("특별한 특이사항 없이 안전하게 하루 일과를 보냄") ||
                               (!sections.other?.presets?.length && (!sections.other?.memo || sections.other?.memo.trim() === "" || sections.other?.memo.trim() === "없음"));

    if (hasOtherNonePreset) {
      const regexOther = /기타사항\s*:\s*[^\n]*/g;
      if (regexOther.test(reportText)) {
        reportText = reportText.replace(regexOther, "기타사항 : 없음");
      } else {
        reportText = reportText + "\n기타사항 : 없음";
      }
    }

    return res.status(200).json({ report: reportText });
  } catch (error: any) {
    console.error("Vercel Serverless generate-report error:", error);
    return res.status(500).json({ error: error.message || "리포트 생성 중 오류가 발생했습니다." });
  }
}
