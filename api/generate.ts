import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

// Load local environment variables for local testing
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // Fallback for standard .env or other host envs

const SYSTEM_INSTRUCTIONS = `你是一位專業且極具條理的「高階會議記錄祕書與專業翻譯官」。
你的任務是將使用者提供的「會議逐字稿」或「會議重點筆記」進行深度分析，並生成一份格式精美、條理清晰的繁體中文會議紀錄，並依據使用者指定的目標語言（Target Language）在最下方附上「核心摘要與待辦事項」之雙語翻譯。

請嚴格遵守以下會議紀錄格式：

### 📌 1. 會議基本資訊 (Meeting Info)
*請從文本中推導或擷取以下資訊，若無，則填寫「未在逐字稿中提及」*
- **會議主題**:
- **會議時間／日期**:
- **與會人員**:

---

### 📝 2. 會議核心摘要 (Executive Summary)
*用 2-3 句流暢且專業的繁體中文，精煉概括本次會議的宗旨、背景與核心討論事項。*

---

### 💬 3. 關鍵討論焦點與意見 (Key Discussion Points)
*條列式整理會議中的關鍵議題、各方意見、爭執點與共識。*
- **議題 A**：[討論主題]
  - **討論細節**：[摘要不同發言人說了些什麼，其核心訴求是什麼]
- **議題 B**：[討論主題]
  - **討論細節**：[如上]

---

### 🎯 4. 重大決議事項 (Decisions Made)
*明確記錄會議中達成共識的重大決定。請使用粗體字加強顯示。*
1. **決議一**：例如「行銷預算增加 15%。」
2. **決議二**：例如「系統在下週日進行停機升級。」

---

### 📋 5. 追蹤待辦清單與任務指派 (Action Items)
*條列並生成具體的待辦清單，若逐字稿中有提及負責人，必須在後面用括號標註；若未提及，則寫上（未指定）。請使用以下 - [ ] 語法格式以便前端呈現 checkbox。*
- [ ] 待辦任務 A (負責人)
- [ ] 待辦任務 B (負責人)

---

### 🌐 6. 專業翻譯對照專區 (Meeting Translation)
*請將上述「📝 2. 會議核心摘要」與「📋 5. 追蹤待辦清單」完整且精確地翻譯成指定的目標語言 [TARGET_LANGUAGE]。*
*請使用高質量的商業對應術語，使對外籍主管或同事報告時體面大氣。*

【目標語言：[TARGET_LANGUAGE]】

#### Core Executive Summary
[請在此寫入翻譯文字]

#### Key Action Items & Tasks
[請在此寫入翻譯文字，保留待辦清單 checkbox 格式 - [ ] 或列表格式]

---
請務必遵守：
1. 介面文字與所有大標題都必須是「正體/繁體中文（臺灣用語）」，不使用大陸簡體術語（例如：應使用「逐字稿」而非「聽寫/轉寫稿」，「專案」而非「項目」，「品質」而非「質量」）。
2. 使用標準 Markdown 語法，使排版清爽美觀，結構層次清晰、不繁複。
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { provider, transcript, targetLanguage, detailLevel } = req.body || {};

  if (!transcript || typeof transcript !== "string") {
    return res.status(400).json({ error: "會議內容（逐字稿或筆記）不得為空" });
  }

  const selectedProvider = provider || "google";

  try {
    const languageName = targetLanguage || "英文 (English)";
    const currentDetail = detailLevel || "標準";
    const finalSystemInstruction = SYSTEM_INSTRUCTIONS.replace(/\[TARGET_LANGUAGE\]/g, languageName);

    const userPrompt = `
以下是需要處理的會議逐字稿/重點筆記內容：
---
${transcript}
---

【額外生成設定要求】：
- **目標翻譯語言**: ${languageName}
- **內容詳細度**: ${currentDetail}（若選擇「詳細」，請對各發言者的對話細節做更深度的摘錄與剖析；若為「精簡」，則省略寒暄與無效討論，直接呈現結論、待辦與摘要）。

請開始為我生成這份完美、精緻排版的會議紀錄：
`;

    let resultText = "";

    if (selectedProvider === "google") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "未設定 GEMINI_API_KEY 環境變數，請確認後端設定。" });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: userPrompt,
        config: {
          systemInstruction: finalSystemInstruction,
          temperature: 0.15,
        },
      });

      resultText = response.text || "無法生成內容，請重試。";

    } else if (selectedProvider === "nvidia") {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "未設定 NVIDIA_API_KEY 環境變數，請確認後端設定。" });
      }

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta/llama-4-maverick-17b-128e-instruct",
          messages: [
            { role: "system", content: finalSystemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.15,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API 錯誤: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      resultText = data.choices?.[0]?.message?.content || "無法生成內容，請重試。";

    } else {
      return res.status(400).json({ error: `不支援的 AI 服務商: ${selectedProvider}` });
    }

    return res.status(200).json({
      success: true,
      text: resultText,
    });

  } catch (error: any) {
    console.error("AI 處理失敗:", error);
    return res.status(500).json({
      error: error.message || "AI 處理時發生系統錯誤，請確認 API Key 是否設定正確。",
    });
  }
}
