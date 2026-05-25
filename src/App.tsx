import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  Volume2,
  Trash2,
  Copy,
  Download,
  History,
  Languages,
  BookOpen,
  Sliders,
  Check,
  Headphones,
  Info,
  Globe,
  CornerDownLeft,
  Settings,
  X,
  VolumeX,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VoiceConfig, PresetPhrase, TTSHistoryItem } from "./types";

// Somali voice recommendations from Gemini tts
const VOICES: VoiceConfig[] = [
  { id: "Puck", name: "Puck (Dabiici / دافئ)", gender: "male", description: "Cod lab ah oo dabiici ah, dhow, aadna ugu dhow codka bini'aadamka.", localName: "صوت رجالي طبيعي وواضح جداً" },
  { id: "Charon", name: "Charon (Muuqaal / رسمي)", gender: "male", description: "Cod lab ah oo qoto dheer oo rasmi ah, ku habboon akhriska qaybaha muhiimka ah.", localName: "صوت رجالي عميق ورسمي" },
  { id: "Fenrir", name: "Fenrir (Xooggan / حماسي)", gender: "male", description: "Cod lab oo xamaasad leh, firfircoon, oo aad u cad.", localName: "صوت رجالي قوي وحيوي مفعم بالوضوح" },
  { id: "Kore", name: "Kore", gender: "female", description: "Cod dumar ah oo deggen, cad, oo ku habboon akhriska guud.", localName: "صوت نسائي هادئ ومتزن" },
  { id: "Zephyr", name: "Zephyr", gender: "female", description: "Cod dumar ah oo jilicsan, hufan, oo naxariis leh.", localName: "صوت نسائي ناعم ورقيق" }
];

const PRESETS: PresetPhrase[] = [
  { category: "greetings", text: "Ku soo dhowow adduunka codka dabiiciga ah ee Af-Soomaaliga!", meaning: "أهلاً بك في عالم الصوت الطبيعي للغة الصومالية!" },
  { category: "greetings", text: "Subax wanaagsan, saaxiibkey! Sidee tahay maanta?", meaning: "صباح الخير يا صديقي! كيف حالك اليوم؟" },
  { category: "greetings", text: "Barasho wanaagsan, aad baan ugu faraxsanahay inaan kula kulmo.", meaning: "سررت بمعرفتك، أنا سعيد جداً بلقائك." },
  { category: "greetings", text: "Nabad iyo caafimaad ayaan idiin rajaynayaa dhammaantiin.", meaning: "أتمنى لكم جميعاً السلامة والصحة." },

  { category: "essential", text: "Fadlan ma ii sheegi kartaa halka aan ka heli karo biyo nadiif ah?", meaning: "برجاء، هل يمكنك إخباري بمكان الحصول على مياه نظيفة؟" },
  { category: "essential", text: "Aad baad u mahadsantahay caawinaadaada weyn.", meaning: "شكراً جزيلًا لك على مساعدتك العظيمة." },
  { category: "essential", text: "Waa hagaag, wax walba way hagaagi doonaan dhawaan insha'Allah.", meaning: "حسنًا، كل شيء سيكون على ما يرام قريبًا إن شاء الله." },
  { category: "essential", text: "Kuma fahmin, fadlan mar kale ma ii soo celin kartaa hadalka?", meaning: "لم أفهمك، هل يمكنك من فضلك إعادة الكلام مرة أخرى؟" },

  { category: "questions", text: "Saacaddu waa imisa hadda meeshan?", meaning: "كم الساعة الآن في هذا المكان؟" },
  { category: "questions", text: "Halkee ayaan ku kulmi doonaa caawa saaxiibyaal?", meaning: "أين سنلتقي الليلة يا أصدقاء؟" },
  { category: "questions", text: "Intee in le'eg ayay ku kacaysaa tigidhka safarku?", meaning: "كم تكلفة تذكرة السفر؟" },
  { category: "questions", text: "Ma heli kartaa qof halkan ku hadla Af-Carabi ama Ingiriis?", meaning: "هل يمكنك العثور على شخص هنا يتحدث العربية أو الإنجليزية؟" },

  { category: "travel", text: "Halkee ayay ku taal madaarka caalamiga ah ee ugu dhow?", meaning: "أين يقع أقرب مطار دولي؟" },
  { category: "travel", text: "Waan lumay, ma ii tilmaami kartaa jidka saxda ah ee loo maro badhtamaha magaalada?", meaning: "لقد تهت، هل يمكنك إرشادي إلى الطريق الصحيح لوسط المدينة؟" },
  { category: "travel", text: "Magaaladani waa mid aad u qurux badan, dadkeeduna waa kuwo naxariis badan.", meaning: "هذه المدينة جميلة للغاية، وشعبها لطيف وودود." }
];

const CATEGORIES = [
  { id: "all", name: "Dhammaan / الكل" },
  { id: "greetings", name: "Salaan / ترحيب" },
  { id: "essential", name: "Muhiim / عبارات أساسية" },
  { id: "questions", name: "Su'aalo / أسئلة" },
  { id: "travel", name: "Socdaal / سفر وتنقل" }
];

export default function App() {
  const [text, setText] = useState<string>("Ku soo dhowow adduunka codka dabiiciga ah ee Af-Soomaaliga!");
  const [selectedVoice, setSelectedVoice] = useState<string>("Puck");
  const [selectedGender, setSelectedGender] = useState<"all" | "male" | "female">("male");
  const [tone, setTone] = useState<string>("natural");
  const [speed, setSpeed] = useState<string>("normal");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [quotaErrorDetails, setQuotaErrorDetails] = useState<string>("");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("somali_tts_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history:", e);
      }
    }
  }, []);

  // Sync history with localStorage
  const saveHistory = (newHistory: TTSHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("somali_tts_history", JSON.stringify(newHistory));
  };

  // Convert Base64 PCM to standard playable WAV Blob URL
  const getWavUrlFromBase64 = (base64String: string, sampleRate = 24000): string => {
    try {
      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const wavLength = 44 + len;
      const headerBuffer = new ArrayBuffer(wavLength);
      const view = new DataView(headerBuffer);

      /* RIFF identifier */
      view.setUint32(0, 0x52494646, false); // "RIFF"
      /* file length */
      view.setUint32(4, wavLength - 8, true);
      /* RIFF type */
      view.setUint32(8, 0x57415645, false); // "WAVE"
      /* format chunk identifier */
      view.setUint32(12, 0x666d7420, false); // "fmt "
      /* format chunk length */
      view.setUint32(16, 16, true);
      /* sample format (raw PCM = 1) */
      view.setUint16(20, 1, true);
      /* channel count (mono = 1) */
      view.setUint16(22, 1, true);
      /* sample rate */
      view.setUint32(24, sampleRate, true);
      /* byte rate = sampleRate * channelCount * bytesPerSample */
      view.setUint32(28, sampleRate * 1 * 2, true);
      /* block align = channelCount * bytesPerSample */
      view.setUint16(32, 1 * 2, true);
      /* bits per sample */
      view.setUint16(34, 16, true);
      /* data chunk identifier */
      view.setUint16(36, 0x6461, false); // "da" part 1
      view.setUint16(38, 0x7461, false); // "ta" part 2
      /* data chunk length */
      view.setUint32(40, len, true);

      // Copy PCM data
      const dst = new Uint8Array(headerBuffer, 44);
      dst.set(bytes);

      const blob = new Blob([headerBuffer], { type: "audio/wav" });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Error creating wav URL:", e);
      return "";
    }
  };

  // Trigger synthesis request to backend
  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError("Fadlan qor wax qoraal ah oo Soomaali ah / الرجاء إرسال نص صومالي صالح.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsQuotaError(false);
    setQuotaErrorDetails("");
    setIsPlaying(false);

    // Stop current playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          tone,
          speed
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isQuotaError) {
          setIsQuotaError(true);
          setQuotaErrorDetails(data.details);
        }
        throw new Error(data.error || "Synthesis failed");
      }

      const wavUrl = getWavUrlFromBase64(data.audio);
      setCurrentAudioUrl(wavUrl);

      // Save to history
      const newItem: TTSHistoryItem = {
        id: Date.now().toString(),
        text: data.text,
        voice: data.voice,
        tone: data.tone,
        speed: data.speed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: data.audio
      };

      saveHistory([newItem, ...history.slice(0, 19)]); // Limit history to 20

      // Audio autoplay config
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.log("Autoplay blocked or failed:", err);
              setIsPlaying(false);
            });
        }
      }, 100);

    } catch (err: any) {
      console.error("TTS Server Error:", err);
      setError(err.message || "Xiriirka khadka ayaa go'ay ama cilad ayaa ka dhacday server-ka.");
    } finally {
      setLoading(false);
    }
  };

  // Play audio from history
  const handlePlayHistoryItem = (item: TTSHistoryItem) => {
    setError(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const wavUrl = getWavUrlFromBase64(item.audioBase64);
      setCurrentAudioUrl(wavUrl);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.log("Playback failed:", err));
        }
      }, 100);
    } catch (e) {
      setError("Cilad ayaa dhacday intii la samaynayay codka.");
    }
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory(history.filter(item => item.id !== id));
  };

  // Download Audio
  const handleDownload = (base64: string, filename = "somali_voice.wav") => {
    const wavUrl = getWavUrlFromBase64(base64);
    const link = document.createElement("a");
    link.href = wavUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy text to clipboard
  const handleCopyText = (textToCopy: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick preset click
  const handlePresetClick = (presetText: string) => {
    setText(presetText);
    setError(null);
  };

  // Draw simulated sound waves when playing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      
      if (isPlaying) {
        phase += 0.15;
        // Draw standard vocal visualizer waves
        const wavesCount = 4;
        const colors = [
          "rgba(52, 211, 153, 0.6)",   // Emerald
          "rgba(6, 182, 212, 0.4)",    // Cyan
          "rgba(99, 102, 241, 0.3)",   // Indigo
          "rgba(147, 51, 234, 0.2)"    // Purple
        ];

        for (let i = 0; i < wavesCount; i++) {
          ctx.beginPath();
          ctx.strokeStyle = colors[i];
          ctx.lineWidth = i === 0 ? 3 : 1.5;

          const amplitude = (height / 2.5) * (1 - i * 0.22);
          const frequency = 0.015 + i * 0.005;

          for (let x = 0; x < width; x++) {
            // Apply a nice fade at edges (bell curve)
            const edgeScale = Math.sin((x / width) * Math.PI);
            const y = height / 2 + Math.sin(x * frequency + phase + i * 1.5) * amplitude * edgeScale;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // Flat center line with subtle noise
        ctx.beginPath();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      id = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(id);
    };
  }, [isPlaying]);

  const filteredPresets = PRESETS.filter(
    preset => activeCategory === "all" || preset.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-between font-sans overflow-x-hidden relative animate-fade-in" id="app_root">
      
      {/* Mesh Background Blobs (Frosted Glass theme specification) */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Top Navigation / Header with Frosted look */}
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg" id="brand_badge">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Codka Somali <span className="text-emerald-400">AI</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                مطور تحويل النص الصومالي إلى صوت بشري فائق الجودة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs text-emerald-400 font-mono">
            <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>AI ENGINE: GEMINI-3.1-TTS</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main workspace section - Left block */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Input card with clean glass layer */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden" id="workspace_card">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8] flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  Geli Qoraalka Soomaaliga / أدخل النص الصومالي
                </span>
                <button
                  onClick={() => setText("")}
                  disabled={!text}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Masax / مسح
                </button>
              </div>

              <div className="relative">
                <textarea
                  id="somali_text_input"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value.slice(0, 1000));
                    setError(null);
                  }}
                  placeholder="Halkan ku qor qoraalkaaga ama ka dooro weedhaha hoose..."
                  className="w-full h-48 bg-slate-950/45 border border-white/15 rounded-2xl p-4 text-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition resize-none leading-relaxed"
                  dir="ltr"
                />

                <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-500">
                  {text.length} / 1000
                </div>
              </div>

              {error && (
                isQuotaError ? (
                  <div className="mt-4 p-5 sm:p-6 bg-gradient-to-br from-amber-950/40 to-[#0f172a] border border-amber-500/30 rounded-2xl text-slate-100 flex flex-col gap-4 relative overflow-hidden shadow-xl" id="quota_error_alert">
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-amber-300">
                          Xadka tijaabada ee maalin laha ah waa la dhaafay / انتهت الحصّة التجريبية
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {error}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-3">
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                        Sida loo xalliyo si aan xad lahayn u isticmaasho / للتشغيل غير المحدود:
                      </div>
                      <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                        <div className="flex gap-2">
                          <span className="text-emerald-400 font-bold shrink-0">1.</span>
                          <span>
                            <strong>Ku dar API Key-gaaga gaarka ah:</strong> Wuxuu ku siinayaa malaayiin xaraf oo bilaash ah. Riix astaanta <strong>Settings (⚙️) / Secrets</strong> ee ku taal dhinaca bidix ee hoose ee AI Studio si aad u galiso <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-emerald-400">GEMINI_API_KEY</code>.
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-emerald-400 font-bold shrink-0">2.</span>
                          <span>
                            <strong>إضافة مفتاح الـ API الخاص بك:</strong> يمنحك استخداماً مجانياً غير محدود تماماً وعبر سحابتك الخاصة. اضغط على أيقونة <strong>Settings (⚙️) ثم الأسرار (Secrets)</strong> في أسفل يسار بيئة العمل في AI Studio، وأضف متغيّراً باسم <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-emerald-400">GEMINI_API_KEY</code> بقيمتك الخاصة.
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 italic">
                          * Haddii aadan haysan API Key, waxaad ka heli kartaa bilaash degdeg ah adoo booqanaya {" "}
                          <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                            aistudio.google.com
                          </a>.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3.5 bg-red-950/30 border border-red-500/30 text-red-300 rounded-2xl text-sm flex gap-2 items-start" id="error_alert">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>{error}</div>
                  </div>
                )
              )}

              {/* Action Toolbar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">PRESETS:</span>
                  <div className="flex gap-1">
                    {CATEGORIES.slice(0, 3).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                          activeCategory === cat.id
                            ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold"
                            : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {cat.name.split("/")[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="synthesize_btn"
                  onClick={handleSynthesize}
                  disabled={loading || !text.trim()}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:opacity-95 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>La dhisayo codka... / جاري التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
                      <span>Abuur Codka (Convert)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl" id="presets_container">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3.5 mb-4 gap-2">
                <span className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Weedhaha Diyaar Ka Ah / عبارات شائعة ومنتقاة
                </span>
                
                {/* Full Categories list */}
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        activeCategory === cat.id
                          ? "bg-white/10 text-emerald-400 font-semibold border border-emerald-500/30"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      {cat.name.split("/")[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset.text)}
                    className="group text-left p-3.5 bg-white/3 hover:bg-white/5 transition-all rounded-2xl border border-white/5 hover:border-white/10 flex flex-col justify-between gap-1 cursor-pointer"
                  >
                    <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition">
                      {preset.text}
                    </span>
                    <span className="text-xs text-slate-500 italic block cursor-default" dir="rtl">
                      {preset.meaning}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Settings panel & Output tools - Right block */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Audio Visualization & Current Player */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl" id="audio_status_card">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-slate-300">
                <Headphones className="w-4 h-4 text-emerald-400" />
                Mashiinka Dhajinta & Codka / قارئ الصوت الذكي
              </h3>

              {/* Visualizer Canvas */}
              <div className="w-full h-24 bg-slate-950/45 rounded-2xl border border-white/10 mb-4 overflow-hidden relative flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={96}
                  className="w-full h-full block"
                />
                {!isPlaying && !loading && (
                  <div className="absolute text-xs text-slate-500 font-medium">
                    Sugayo qoraalka / بانتظار تشغيل الملف
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-slate-950/50 flex flex-col items-center justify-center gap-1.5">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-[11px] text-emerald-400 font-mono">DIGITIZING...</span>
                  </div>
                )}
              </div>

              {/* Custom Styled Audio Control */}
              {currentAudioUrl ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-950/45 p-3 rounded-2xl border border-white/10">
                    <audio
                      ref={audioRef}
                      src={currentAudioUrl}
                      controls
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          if (isPlaying) {
                            audioRef.current.pause();
                          } else {
                            audioRef.current.play();
                          }
                        }
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 text-slate-200 cursor-pointer"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
                          <span>Jooji / إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
                          <span>Dhagayso / تشغيل</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        const base64 = history[0]?.audioBase64;
                        if (base64) handleDownload(base64);
                      }}
                      disabled={history.length === 0}
                      className="px-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition border border-white/10 flex items-center justify-center disabled:opacity-45 cursor-pointer"
                      title="Download WAV File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
                  Riix "Abuur Codka" si aad u abuurto cod dabiici ah
                </div>
              )}
            </div>
            
            {/* Custom Settings Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative" id="voice_settings_card">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Habaynta Codka / إعدادات الصوت
                </h3>
              </div>

              {/* Voices Selector */}
              <div className="mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                  <label className="text-xs text-slate-400 font-medium">
                    Dooro Codka / اختر المتحدث:
                  </label>
                  
                  {/* Gender Filter Toggle Options */}
                  <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-white/10 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGender("male");
                        setSelectedVoice("Puck");
                      }}
                      className={`text-[9px] px-2 py-1 rounded transition cursor-pointer ${
                        selectedGender === "male"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      👨‍♂️ Rag / رجال
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGender("female");
                        setSelectedVoice("Kore");
                      }}
                      className={`text-[9px] px-2 py-1 rounded transition cursor-pointer ${
                        selectedGender === "female"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      👩‍💼 Dumar / نساء
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGender("all")}
                      className={`text-[9px] px-2 py-1 rounded transition cursor-pointer ${
                        selectedGender === "all"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Dhammaan
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
                  {VOICES.filter(v => selectedGender === "all" || v.gender === selectedGender).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`w-full text-left p-3 rounded-2xl border text-xs transition flex items-center justify-between cursor-pointer ${
                        selectedVoice === v.id
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm font-medium"
                          : "bg-white/3 border-white/5 text-slate-400 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <span>{v.name}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] rounded font-mono font-bold ${selectedVoice === v.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>
                            {v.gender === "female" ? "👩 Dumar" : "👨 Rag (HD)"}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[210px] truncate">
                          {v.description}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-sans" dir="rtl">
                        {v.localName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selection */}
              <div className="mb-4">
                <label className="text-xs text-slate-400 block mb-2 font-medium">
                  Ruuxda Hadalka / النبرة والأسلوب:
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="natural">Dabiici / طبيعي وعادي</option>
                  <option value="cheerful">Faraxsan / نبرة مبهجة وسعيدة</option>
                  <option value="formal">Rami ah / أسلوب رسمي وقور</option>
                  <option value="excited">Xamaasad leh / نبرة حماسية</option>
                  <option value="slow">Tartiib / نبرة تعليمية هادئة</option>
                </select>
              </div>

              {/* Speed Adjustment */}
              <div>
                <label className="text-xs text-slate-400 block mb-2 font-medium">
                  Xawaaraha / سرعة النطق:
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-white/10">
                  {["slow", "normal", "fast"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`text-[10px] py-1.5 rounded-lg capitalize transition cursor-pointer ${
                        speed === s
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      {s === "slow" ? "Tartiib" : s === "normal" ? "Normal" : "Degdeg"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* History Feed */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex-grow">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-sm font-semibold flex items-center gap-1.5 text-slate-300">
                  <History className="w-4 h-4 text-amber-500" />
                  Taariikhda / قائمة التسجيلات السابقة
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-white/10">
                  {history.length}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 cursor-default">
                  Ma jiraan wax taariikh ah hadda
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePlayHistoryItem(item)}
                      className="group p-3 bg-white/3 hover:bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition cursor-pointer flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-200 line-clamp-2 pr-2">
                          {item.text}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">
                            {item.voice}
                          </span>
                          <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">
                            {item.tone === "natural" ? "Natural" : item.tone}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-transparent">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.audioBase64, `somali_voice_${item.id}.wav`);
                          }}
                          className="p-1 hover:text-white text-slate-500 rounded hover:bg-white/5 transition cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(item.text, item.id, e);
                          }}
                          className="p-1 hover:text-white text-slate-500 rounded hover:bg-white/5 transition cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1 hover:text-red-400 text-slate-600 rounded hover:bg-white/5 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Informational helpful tips section */}
        <section className="mt-12 bg-white/3 border-t border-white/10 pt-8">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400" />
            Waxyaalaha muhiimka ah / معلومات إرشادية حول نطق اللغة الصومالية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 font-medium">
            <div className="bg-white/3 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              <span className="text-slate-200 block mb-1 font-semibold">1. Xarfaha gaarka ah (الحروف الخاصة):</span>
              Xarfaha sida <code className="text-emerald-400 font-bold font-mono">C</code> iyo <code className="text-emerald-400 font-bold font-mono">X</code> waxay leeyihiin ku dhawaaqis gaar ah oo la mid ah xarfaha Carabiga (ع، ح). Qaab-dhismeedka Gemini wuxuu u akhriyaa si dhammaystiran oo sax ah.
            </div>
            <div className="bg-white/3 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              <span className="text-slate-200 block mb-1 font-semibold">2. Isticmaalka nبرat (التحكم في الأسلوب):</span>
              Xulo nbradda <code className="text-emerald-400 font-bold">Formal</code> haddii aad akhrinayso maqaal rasmi ah ama warka, xulo <code className="text-emerald-400 font-bold">Cheerful</code> haddii ay tahay salaan ama farxad.
            </div>
            <div className="bg-white/3 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              <span className="text-slate-200 block mb-1 font-semibold">3. Soo dhowaynta maqalka (تحميل الصوت):</span>
              Diiwaanka soosaaray oo kasta waad soo dejisan kartaa adoo isticmaalaya badhanka <code className="text-emerald-400 font-bold">Download</code> ka dib markay akhrisku dhammaado.
            </div>
          </div>
        </section>

      </main>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-600 cursor-default font-medium mt-12 bg-slate-950/30">
        <p>Lab-ka Codka Casriga ah ee Af-Soomaaliga © {new Date().getFullYear()} — Crafted elegantly with Google Gemini 3.1 TTS Engine</p>
      </footer>

    </div>
  );
}
