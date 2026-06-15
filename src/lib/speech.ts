// 语音播放工具函数

// 检查浏览器是否支持语音合成
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// 页面加载时预加载语音列表（安卓需要）
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}

// 当前播放的音频（用于停止）
let currentAudio: HTMLAudioElement | null = null;

// 多个 TTS 源，按优先级尝试
const TTS_SOURCES = [
  // 有道词典（国内可用，速度快）
  (text: string) => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`,
  // 百度翻译（国内可用）
  (text: string) => `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text)}&spd=3`,
  // Google Translate（国外可用）
  (text: string) => `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`,
];

// 使用 TTS 兜底（并行请求，用最快的）
function playWithFallback(text: string): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  let played = false;

  TTS_SOURCES.forEach((getUrl) => {
    if (played) return;

    const url = getUrl(text);
    const audio = new Audio(url);

    audio.oncanplaythrough = () => {
      if (played) return;
      played = true;
      currentAudio = audio;
      audio.play().catch(() => {});
    };

    audio.onerror = () => {};
    audio.load();
  });
}

// 播放英语单词发音
export function speakWord(word: string): void {
  // 优先使用 Web Speech API
  if (isSpeechSupported()) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    // 兜底：使用有道/百度/Google TTS
    playWithFallback(word);
  }
}

// 播放例句发音
export function speakSentence(sentence: string): void {
  if (isSpeechSupported()) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    // 长句子截断避免某些TTS服务失败
    const shortText = sentence.length > 100 ? sentence.substring(0, 100) : sentence;
    playWithFallback(shortText);
  }
}

// 播放例句发音（快速版）
export function speakSentenceFast(sentence: string): void {
  if (isSpeechSupported()) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    const shortText = sentence.length > 100 ? sentence.substring(0, 100) : sentence;
    playWithFallback(shortText);
  }
}

// 停止播放
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
