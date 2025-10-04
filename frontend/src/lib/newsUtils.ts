import { NewsDTO } from "@/types/news";

export const getHotnessColor = (score: number): string => {
  if (score >= 0.8) return "hotness-critical";
  if (score >= 0.6) return "hotness-high";
  if (score >= 0.3) return "hotness-medium";
  return "hotness-low";
};

export const getSentimentColor = (sentiment: string): string => {
  const normalized = sentiment.toLowerCase();
  if (normalized.includes("позитивн") || normalized.includes("positive")) return "success";
  if (normalized.includes("негативн") || normalized.includes("negative")) return "destructive";
  return "muted";
};

export const getImpactColor = (impact: string): string => {
  const normalized = impact.toLowerCase();
  if (normalized.includes("высок") || normalized.includes("high")) return "destructive";
  if (normalized.includes("средн") || normalized.includes("medium")) return "warning";
  return "muted";
};

export const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "только что";
  if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
  if (diffInHours < 24) return `${diffInHours} ч назад`;
  if (diffInDays < 7) return `${diffInDays} д назад`;
  
  return date.toLocaleDateString("ru-RU", { 
    day: "numeric", 
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
};

export const formatRelativeDate = formatDate;

export const getHotnessLabel = (score: number): string => {
  if (score >= 0.8) return "Критически важно";
  if (score >= 0.6) return "Очень важно";
  if (score >= 0.3) return "Важно";
  return "Умеренно";
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

export const formatDraftForCopy = (news: NewsDTO): string => {
  return `${news.headline}

${news.lead}

${news.bullets.map(bullet => `• ${bullet}`).join("\n")}

${news.conclusion}`;
};
