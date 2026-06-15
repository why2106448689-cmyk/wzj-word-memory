// 翻译工具函数

// 使用免费翻译 API 将英文翻译为中文
export async function translateToChinese(text: string): Promise<string> {
  if (!text) return "";
  
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch {
    // 翻译失败时静默处理
  }
  
  return "";
}
