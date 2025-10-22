export interface PrizeAward {
  id: string;
  projectId: string;
  prizeId: string;
  eventId: string;
  awardedAt: string;
  awardedBy?: string;
}

export type PrizeFilterStatus = "all" | "winners" | "no-prizes";
