export interface VoiceConfig {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  description: string;
  localName: string;
}

export interface PresetPhrase {
  category: string;
  text: string;
  meaning: string;
}

export interface TTSHistoryItem {
  id: string;
  text: string;
  voice: string;
  tone: string;
  speed: string;
  timestamp: string;
  audioBase64: string; // Stored to preserve generated voice
}
