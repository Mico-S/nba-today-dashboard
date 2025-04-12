"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Snowflake } from "lucide-react";

// Remove local type definitions
// import type { StreakMap } from './page';
// interface TeamInfo { ... }
// interface Game { ... }

// Import shared types
import type { StreakMap, Game } from "@/types";

// Helper to format date string for display
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString; // Fallback
  }
};

// Helper to parse matchup and format score/status
const formatMatchup = (
  game: Game,
  streakMap: StreakMap | null
): React.ReactNode => {
  const visitor = game.visitor_team;
  const home = game.home_team;
  const STREAK_THRESHOLD = 3;
  const visitorAbbr = visitor?.TEAM_ABBREVIATION ?? "???";
  const homeAbbr = home?.TEAM_ABBREVIATION ?? "???";
  const visitorStreak = visitor?.TEAM_ID ? streakMap?.[visitor.TEAM_ID] : null;
  const homeStreak = home?.TEAM_ID ? streakMap?.[home.TEAM_ID] : null;

  // --- Function to render icon based on streak string ---
  const renderStreakIcon = (streak: string | null | undefined) => {
    if (!streak) return null;
    const match = streak.match(/([WL])\s*(\d+)/);
    if (match) {
      const type = match[1];
      const count = parseInt(match[2], 10);
      if (count >= STREAK_THRESHOLD) {
        const Icon = type === "W" ? Flame : Snowflake;
        const iconColor = type === "W" ? "text-orange-500" : "text-blue-400";
        return <Icon className={`h-4 w-4 ${iconColor} ml-1`} />;
      }
    }
    return null;
  };
  // --- End Icon Function ---

  // Handle TBD Teams
  if (visitorAbbr === "???" && homeAbbr === "???") {
    let statusDisplayTBD = game.GAME_STATUS_TEXT;
    const timeMatchTBD = game.GAME_STATUS_TEXT.match(
      /\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*ET)?/i
    );
    statusDisplayTBD = timeMatchTBD ? timeMatchTBD[0] : game.GAME_STATUS_TEXT;
    return (
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Teams TBD</span>
        <span className="text-xs text-muted-foreground">
          {statusDisplayTBD}
        </span>
      </div>
    );
  }

  // --- Re-add Status/Score display logic ---
  let statusDisplay = game.GAME_STATUS_TEXT;
  let scoreDisplay = "";
  if (game.GAME_STATUS_ID === 3) {
    // Final
    const visitorPts = visitor?.PTS ?? "-";
    const homePts = home?.PTS ?? "-";
    statusDisplay = "Final";
    scoreDisplay = `(${visitorPts} - ${homePts})`;
  } else if (game.GAME_STATUS_ID === 2) {
    // In Progress
    const visitorPts = visitor?.PTS ?? "0";
    const homePts = home?.PTS ?? "0";
    statusDisplay = game.GAME_STATUS_TEXT;
    scoreDisplay = `(${visitorPts} - ${homePts})`;
  } else {
    // Upcoming or other status
    const timeMatch = game.GAME_STATUS_TEXT.match(
      /\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*ET)?/i
    );
    statusDisplay = timeMatch ? timeMatch[0] : game.GAME_STATUS_TEXT;
  }
  // --- End Status/Score display logic ---

  // --- Main Return JSX - Updated Layout ---
  return (
    // Outermost: Flex row, space between, align center vertically
    <div className="flex justify-between items-center text-sm w-full">
      {/* Left Box: Matchup and Date stacked vertically */}
      <div className="flex flex-col items-start space-y-1">
        {/* Matchup line */}
        <div className="flex items-center flex-shrink-0 overflow-hidden">
          <span className="font-medium inline-flex items-center">
            <span>{visitorAbbr}</span>
            {renderStreakIcon(visitorStreak)}
          </span>
          <span className="mx-1 sm:mx-2 text-muted-foreground">@</span>
          <span className="font-medium inline-flex items-center">
            <span>{homeAbbr}</span>
            {renderStreakIcon(homeStreak)}
          </span>
        </div>
        {/* Date line */}
        <div className="text-xs text-muted-foreground">
          {formatDate(game.GAME_DATE_EST)}
        </div>
      </div>

      {/* Right Box: Status and Score */}
      <div className="flex items-center text-xs sm:text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap pl-2">
        <span className="mr-1 sm:mr-2">{statusDisplay}</span>
        {scoreDisplay && <span>{scoreDisplay}</span>}
      </div>
    </div>
  );
};

// Update props for the component - remove rankMap
interface RecentGamesProps {
  games: Game[];
  streakMap: StreakMap | null;
  // rankMap: RankMap | null; // Removed
}

// Update component signature
export function RecentGames({ games, streakMap }: RecentGamesProps) {
  // Remove rankMap from signature
  // Remove TOP_RANK_THRESHOLD constant
  // const TOP_RANK_THRESHOLD = 4;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ... heading/no games message removed ... */}
      {games && games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            // Remove isKeyMatchup calculation
            // const visitorRank = ...
            // const homeRank = ...
            // const isKeyMatchup = ...

            return (
              // Remove relative div wrapper and star rendering
              // <div key={game.GAME_ID} className="relative">
              <Card
                key={game.GAME_ID}
                className="transition-shadow hover:shadow-md h-full flex flex-col"
              >
                {/* Remove CardHeader for date */}
                {/* <CardHeader ...> */}
                <CardContent className="p-3 flex-grow flex flex-col justify-center">
                  {" "}
                  {/* Use standard padding */}
                  {formatMatchup(game, streakMap)}
                </CardContent>
              </Card>
              // </div>
            );
          })}
        </div>
      ) : (
        <p>No key matchups to display.</p>
      )}
    </div>
  );
}
