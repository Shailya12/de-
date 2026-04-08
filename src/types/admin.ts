export interface AdminQuestion {
  id: string;
  number: number;
  marks: number;
  text: string;
  imageUrl: string;
  markScheme?: string;
  topicId: string;
  year: number;
  season: "May/June" | "Oct/Nov" | "Feb/Mar";
  paperNumber: number;
  variant: number;
  addedAt: string;
}
