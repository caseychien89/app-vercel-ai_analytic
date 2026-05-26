import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  FileDown, 
  Languages, 
  Activity, 
  Sliders, 
  AlertCircle,
  FileText,
  Terminal,
  RefreshCw,
  Layers,
  ArrowRight,
  User,
  Heart,
  Lightbulb,
  Info
} from "lucide-react";
import { MEETING_TEMPLATES, MeetingTemplate } from "./data/templates";
import MarkdownRenderer from "./components/MarkdownRenderer";

export default function App() {
  const [inputText, setInputText] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>("英文 (English)");
  const [detailLevel, setDetailLevel] = useState<string>("標準");
  const [loading, setLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [provider, setProvider] = useState<string>("google");
  
  // Custom interactive Bento feature states
  const [smartCategory, setSmartCategory] = useState<boolean>(true);
  const [showTips, setShowTips] = useState<boolean>(true);

  const languages = [
    "英文 (English)",
    "日文 (Japanese)",
    "韓文 (Korean)",
    "德文 (German)",
    "法文 (French)",
    "西班牙文 (Spanish)",
    "簡體中文 (Simplified Chinese)",
    "越南文 (Vietnamese)",
    "泰文 (Thai)"
  ];

  const detailLevels = ["精簡", "標準", "詳細"];

  // Reassuring messages during loading
  const loadingSteps = [
    "正在分析會議逐字稿語境...",
    "正在提取主題、關鍵議題與共識對話...",
    "正在建立結構化待辦任務清單...",
    "正在生成符合專業商務標準的繁體中文會議紀錄...",
    "正在進行深度多國語言專業翻譯與對照..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleApplyTemplate = (temp: MeetingTemplate) => {
    setInputText(temp.transcript);
    setSelectedTemplateId(temp.id);
    triggerToast(`已載入「${temp.title}」範本！`);
  };

  const handleClear = () => {
    setInputText("");
    setSelectedTemplateId("");
    triggerToast("輸入框已清空");
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setErrorMsg("請輸入或貼上一些會議內容、逐字稿或隨手重點筆記。");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResultText("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          transcript: inputText,
          targetLanguage,
          detailLevel: `${detailLevel}${smartCategory ? "（啟用智慧分類與標籤識別）" : ""}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "伺服器發生未知的 AI 分析故障，請再試一次。");
      }

      setResultText(data.text);
      triggerToast("會議紀錄與翻譯生成成功！");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "連線至 AI 伺服器失敗，請檢查環境變數 GEMINI_API_KEY 或 NVIDIA_API_KEY 是否正確設定。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      triggerToast("已複製完整內容到剪貼簿！");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = resultText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        triggerToast("已複製到剪貼簿！");
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        triggerToast("複製失敗，請手動複製右側內容。");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    if (!resultText) return;

    let fileName = "會議紀錄與翻譯對照.md";
    const titleMatch = resultText.match(/會議主題:\s*(.*)/);
    if (titleMatch && titleMatch[1]) {
      const parsedTitle = titleMatch[1].trim().replace(/[\\/:*?"<>|]/g, "");
      if (parsedTitle && parsedTitle !== "未在逐字稿中提及") {
        fileName = `會議紀錄_${parsedTitle}.md`;
      }
    }

    const blob = new Blob([resultText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`檔案「${fileName}」下載成功！`);
  };

  const wordCount = inputText.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased p-4 sm:p-6 lg:p-8">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-full shadow-lg text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section designed according to the Bento mockup */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 max-w-7xl w-full mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            AI 會議助手 <span className="text-indigo-600">IntelliMeet</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            高效率會議紀錄生成、重點摘要與多語系翻譯對照工具（繁體中文商務秘書版）
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2 shadow-xs">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-700">
              {provider === "google" ? "Gemini 2.5 Lite 已啟動" : "NVIDIA Llama 4 已啟動"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Bento Grid Container */}
      <main className="grid grid-cols-12 gap-4 max-w-7xl w-full mx-auto flex-grow items-stretch">
        
        {/* Bento Cell 1: Templates / Quick selector (Span 5 on Desktop) */}
        <section className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200/85 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300/80 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-indigo-500" />
                選擇會議範本快速體驗
              </h2>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                精選商用
              </span>
            </div>
            
            <div className="space-y-2">
              {MEETING_TEMPLATES.map((temp) => (
                <button
                  key={temp.id}
                  onClick={() => handleApplyTemplate(temp)}
                  className={`w-full group text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${
                    selectedTemplateId === temp.id
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                      : "border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{temp.title}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-500 transition-colors">
                      主題：{temp.category}
                    </span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    selectedTemplateId === temp.id ? "text-indigo-600 translate-x-1" : "text-slate-300 group-hover:text-slate-500"
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {showTips && (
            <div className="mt-4 p-3 bg-indigo-50/40 border border-indigo-100/30 rounded-xl flex items-start gap-2 text-[11px] text-indigo-800 leading-relaxed">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">高階秘書提示：</span>
                您可以點擊上方任一模組代入預設的會議資料，或者直接在下方貼上您自己的 Zoom/Teams 錄音逐字稿！
              </div>
            </div>
          )}
        </section>

        {/* Bento Cell 2: Output Container (Span 7, Top Half on Desktop) */}
        <section className="col-span-12 lg:col-span-7 lg:row-span-4 bg-white rounded-2xl border border-slate-200/85 shadow-xs p-5 flex flex-col hover:border-slate-300/80 transition-all duration-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
              AI 生成會議紀錄與翻譯結果
            </h2>
            
            {resultText && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-indigo-100 leading-none"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已複製</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>複製結果碼</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="text-xs font-semibold text-slate-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-slate-200 leading-none"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>下載 (Markdown)</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 min-h-[320px] lg:max-h-[520px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-12 px-4 text-center"
                >
                  <div className="relative mb-5 spin-container">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse absolute inset-3.5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1.5">
                    AI 正在全力解析並翻譯您的會議軌跡...
                  </h3>
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-slate-500 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-100 inline-block max-w-[280px]"
                  >
                    {loadingSteps[loadingStep]}
                  </motion.p>
                </motion.div>
              ) : resultText ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <MarkdownRenderer content={resultText} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 mb-4">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">
                    等待輸入原始會議內容
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    請在左下方的輸入框中，貼上或輸入 Zoom/Teams 逐字稿，然後點擊「生成」按鈕，AI 秘書將在此呈現精美的結構化摘要與您指定的目標語系翻譯。
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Bento Cell 3: Raw Transcript Input Area (Span 5 on Desktop) */}
        <section className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200/85 shadow-xs p-5 flex flex-col hover:border-slate-300/80 transition-all duration-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-500" />
              原始會議逐字稿 / 重點筆記輸入
            </h2>
            {wordCount > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空
              </button>
            )}
          </div>

          <div className="relative flex-1 min-h-[220px] sm:min-h-[260px] flex flex-col mb-2">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setSelectedTemplateId(""); // custom raw text
              }}
              disabled={loading}
              placeholder="在此貼上您從 Microsoft Teams, Google Meet, Zoom 或隨讀錄音中複製下來的繁體中文逐字稿..."
              className="w-full flex-1 p-4 bg-slate-50/50 rounded-xl border border-slate-200/40 focus:border-indigo-500 focus:bg-white focus:outline-hidden text-slate-700 text-xs sm:text-sm leading-relaxed placeholder:text-slate-400 resize-none select-all transition-all"
            />
            <span className="absolute bottom-3 right-3 text-[10px] sm:text-xs font-semibold text-slate-400 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-100">
              字數統計：{wordCount.toLocaleString()} 字
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Bento Cell 4: Select Settings Configuration (Span 5 on Desktop, bottom left configuration) */}
        <section className="col-span-12 lg:col-span-5 bg-slate-900 rounded-2xl p-5 flex flex-col text-white justify-between shadow-xs hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              翻譯設定與 AI 智慧風格偏好
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">
                  AI 服務提供商 (AI Provider)
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-800 text-slate-200 border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium cursor-pointer"
                >
                  <option value="google">Google Gemini (gemini-2.5-flash-lite)</option>
                  <option value="nvidia">NVIDIA (meta/llama-4-maverick-17b-128e-instruct)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">
                  目標語言 (Target Language for Translation)
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-800 text-slate-200 border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 font-bold uppercase tracking-wider">
                  摘要風格 / 內容詳細度 (Detail Strategy)
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg">
                  {detailLevels.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDetailLevel(lvl)}
                      disabled={loading}
                      className={`py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                        detailLevel === lvl
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    啟用 AI 智慧主題分類
                  </span>
                  <button
                    onClick={() => setSmartCategory(!smartCategory)}
                    className={`w-8 h-4 rounded-full relative transition-colors duration-200 outline-hidden ${
                      smartCategory ? "bg-indigo-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                        smartCategory ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    顯示專業助手提示框
                  </span>
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className={`w-8 h-4 rounded-full relative transition-colors duration-200 outline-hidden ${
                      showTips ? "bg-indigo-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                        showTips ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>底層神經網路：{provider === "google" ? "Gemini 2.5 Lite" : "NVIDIA Llama 4 Maverick"}</span>
            <span className="text-yellow-500 font-bold">100% Serverless Functions</span>
          </div>
        </section>

        {/* Bento Cell 5: Generate Action Callout (Span 12) */}
        <section className="col-span-12 lg:col-span-7 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center p-5 cursor-pointer transition-all border border-indigo-500/10">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-full flex items-center justify-center gap-3 font-bold text-base sm:text-lg select-none cursor-pointer outline-hidden"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>正在進行高精度處理與商務對照翻譯...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse shrink-0" />
                <span>立即智慧生成會議記錄與專業翻譯</span>
              </>
            )}
          </button>
        </section>

      </main>

      {/* Footer metadata information block */}
      <footer className="mt-8 mb-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-indigo-400/80 max-w-7xl w-full mx-auto px-4 border-t border-slate-200/50 pt-5 gap-3">
        <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
          <span>系統版本: v3.2.1-stable</span>
          <span>支援 Markdown 格式渲染與複製</span>
          <span>雙語專業翻譯及 CK-List</span>
        </div>
        <div>
          © 2026 AI 會議助手 - 繁體中文高階智能版 版權所有
        </div>
      </footer>
    </div>
  );
}
