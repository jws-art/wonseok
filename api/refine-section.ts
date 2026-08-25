import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function for refining a single section
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
    const { sectionName, presets, memo, currentText, tone } = req.body || {};

    if (!sectionName) {
      return res.status(400).json({ error: "Section name is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다."
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

    const toneGuide = tone === "formal" 
      ? "~함, ~하도록 지도함과 같은 어조형 명사 종결형 문체"
      : tone === "friendly"
      ? "~했어요, ~했습니다 같은 다정하고 부드러운 해요체 경어체"
      : "~함, ~하도록 지도함 어조";

    const prompt = `
사회복지 관찰 보고서의 특정 섹션을 자연스럽고 매끄럽게 재작성하거나 보완해주는 도우미입니다.

작성 대상 섹션: ${sectionName}
선택된 키워드: ${presets?.join(", ") || "없음"}
작성한 메모: ${memo || "없음"}
현재 작성된 텍스트(참고용): ${currentText || "없음"}
원하는 어조: ${toneGuide}

위 정보를 참고하여 ${sectionName} 항목에 들어갈 내용을 자연스럽고 따뜻한 완결된 문장으로 만들어주세요.
* [★매우 중요 - 다양성 극대화] 비슷한 보기를 선택하더라도 생성할 때마다 문장의 시작과 마무리 표현, 단어 선택, 문장 구조를 새롭고 다채롭게 조절하여 늘 개성 있는 형태로 출력해 주십시오.
* [★매우 중요 - 과장 금지 및 사실 중심] 보기에 선택한 키워드와 작성한 메모로 제공된 실제 정보 외에, 일어나지 않은 구체적인 소동, 가상의 대화, 혹은 지나치게 과장되거나 극단적인 표현은 절대 추가하지 마십시오. 오직 전달받은 팩트만을 토대로 문장만 다듬어 완성해 주십시오.
* [★매우 중요 - 입퇴소 지침] 입퇴소 섹션에서 입퇴소 추가 메모를 따로 작성하지 않은 경우에는 '시설에 들어선 후 스스로 신발을 정리하고 교실로 이동했다' 혹은 '신발을 스스로 정리하도록 안내하고'와 같은, 보기에 명시되지 않은 구체적 가공 행위나 임의의 일상 안내 행동은 절대로 지어내거나 포함하지 마십시오. 오직 사용자가 직접 체크한 보기(키워드)와 입력된 시간에만 충실하여 아주 단순명료하게 완성해 주십시오.
* [★매우 중요 - 기타사항 없음] 기타사항 섹션에서 선택된 키워드가 없고 작성한 메모도 비어있거나 '없음'인 경우에는, 무조건 다른 수식어 없이 오직 "없음" 한 단어로만 완성하여 출력해 주십시오.
* 단, 건강관리 섹션을 재작성하는 경우에도 체온 수치나 체온 단어는 일체 제외하여 자연스러운 컨디션 설명으로만 완성해 주십시오.

앞에 섹션명(예: "${sectionName} : ")은 붙이지 말고, 오직 들어갈 핵심 본문 문장만 출력해주세요. 줄바꿈을 최소화하고 매끄러운 단락으로 작성하세요.
`;

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
      console.warn("Primary model error in refine, trying gemini-3.1-flash-lite:", err);
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 1.0,
        }
      });
    }

    return res.status(200).json({ text: (response?.text || "").trim() });
  } catch (error: any) {
    console.error("Vercel Serverless refine-section error:", error);
    return res.status(500).json({ error: error.message || "문장 보완 중 오류가 발생했습니다." });
  }
}
