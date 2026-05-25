import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// REST API for Text to Speech conversion
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, tone, speed } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "الرجاء إدخال نص صومالي صالح." });
    }

    if (!apiKey || !ai) {
      return res.status(500).json({
        error: "مفتاح API الخاص بـ Gemini غير مهيأ. يرجى إضافته في الإعدادات > الأسرار (Settings > Secrets)."
      });
    }

    // Map tones or instructions
    let instruction = "";
    if (tone === "cheerful") {
      instruction = "Ku dhawaaq si farxad iyo kalsooni ku jirto: ";
    } else if (tone === "formal") {
      instruction = "Ku dhawaaq si rasmi ah iyo si deggan: ";
    } else if (tone === "slow") {
      instruction = "Ku dhawaaq si tartiib tartiib ah oo cad: ";
    } else if (tone === "excited") {
      instruction = "Ku dhawaaq si xamaasad leh: ";
    } else if (tone === "instructional") {
      instruction = "Ku dhawaaq si macallinnimo iyo caddaan ah: ";
    } else {
      instruction = "U akhri text-kan si dabiici ah oo sax ah oo Af-Soomaali ah: ";
    }

    // Add speed instructions to prompt if adjusted
    let speedInWord = "";
    if (speed === "slow") {
      speedInWord = " (Fadlan si tartiib ah u hadal).";
    } else if (speed === "fast") {
      speedInWord = " (Fadlan si degdeg ah u hadal).";
    }

    const fullPrompt = `${instruction}"${text}"${speedInWord}`;

    // Supported voices: Puck, Charon, Kore, Fenrir, Zephyr
    const selectedVoice = voice || "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        // Must be an array with a single Modality.AUDIO element.
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "لم يتم إنشاء استجابة صوتية من النموذج. تأكد من أن النص مناسب." });
    }

    return res.json({
      audio: base64Audio,
      text,
      voice: selectedVoice,
      tone,
      speed
    });

  } catch (error: any) {
    console.error("Error in TTS generation:", error);
    
    const errorMessage = error.message || "";
    const isQuotaExceeded = 
      error.status === 429 || 
      errorMessage.includes("429") || 
      errorMessage.includes("quota") || 
      errorMessage.includes("Quota") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("limit: 10");

    if (isQuotaExceeded) {
      return res.status(429).json({
        isQuotaError: true,
        error: "لقد نفد الرصيد المجاني اليومي لـ Gemini TTS على هذا المشروع (حد 10 مرات مجانية يومياً). Sifada dhisidda codka ee maalin laha ah ee bilaashka ah waa la xaddiday (ilaa 10 cod maalintii).",
        details: "Si aad u hesho adeeg aan xad lahayn oo bilaash ah, waxaad ku dari kartaa API Key-gaaga gaarka ah ee Gemini qaybta 'Settings > Secrets' ee dhinaca codsiga. \n\n للحصول على توليد صوتي غير محدود ومجاني تماماً، يمكنك إضافة مفتاح API الخاص بك لـ Gemini عبر زر الإعدادات (Settings > Secrets) في التطبيق."
      });
    }

    return res.status(500).json({
      error: errorMessage || "حدث خطأ أثناء الاتصال بخادم الصوت."
    });
  }
});

// Start the server with Vite support
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
