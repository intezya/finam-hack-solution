export interface NewsDTO {
  id: number;
  title: string;
  link: string;
  hotness_score: number;
  sentiment: string;
  impact_level: string;
  companies: string[];
  sectors: string[];
  people: string[];
  why_now: string;
  headline: string;
  lead: string;
  bullets: string[];
  conclusion: string;
  affected_assets: string[];
  published_at: string; // ISO date string
}

export type SortOption = "hotness" | "date" | "impact";
export type SentimentFilter = "all" | "positive" | "negative" | "neutral";
export type ImpactFilter = "all" | "high" | "medium" | "low";
