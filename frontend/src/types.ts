// Shared type definitions

// Map Team ID to streak string (e.g., "W3")
export interface StreakMap {
  [teamId: number]: string;
}

// Types for ScoreboardV2 data structure
export interface TeamInfo {
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  PTS: number | null;
  WL: string | null;
}

export interface Game {
  GAME_ID: string;
  GAME_DATE_EST: string;
  GAME_STATUS_ID: number;
  GAME_STATUS_TEXT: string;
  HOME_TEAM_ID: number;
  VISITOR_TEAM_ID: number;
  home_team?: TeamInfo;
  visitor_team?: TeamInfo;
}

// API response structure for recent games endpoint
export interface GamesResponse {
  games?: Game[];
  error?: string;
}

// Map Team ID to Playoff Rank
export interface RankMap {
  [teamId: number]: number;
}

// Potentially move other shared interfaces here later (e.g., for standings)
