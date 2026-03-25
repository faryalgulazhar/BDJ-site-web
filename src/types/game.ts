export type GameCategory = "VIDEO GAME" | "BOARD GAME" | "TOURNAMENT";
export type GameStatus = "open" | "full" | "registered";

export interface GameSession {
  id: number;
  title: string;
  date: string;
  time: string;
  totalSpots: number;
  currentRegistrations: number;
  category: GameCategory;
  status: GameStatus;
}
