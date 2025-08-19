export interface PlayerProgress {
  name: string;
  wpm: number;
  completion: number; // percent 0–100
}

export type PlayerUpdate = PlayerProgress[];
