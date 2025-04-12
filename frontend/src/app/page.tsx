"use client"; // Mark this as a Client Component

import { useEffect, useState } from "react";
import axios from "axios";
import { StandingsTable } from "@/components/StandingsTable"; // Import the new component
import { RecentGames } from "@/components/RecentGames"; // Import the RecentGames component
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { IconLegend } from "@/components/IconLegend"; // Import the legend component

// Define the expected API response structure (based on nba_api get_dict() and our FastAPI wrapper)
interface StandingsResponse {
  resultSets?: [
    {
      name: string;
      headers: string[];
      rowSet: (string | number)[][];
    }
    // Potentially other result sets
  ];
  error?: string; // Added error field from our FastAPI endpoint
}

// Define the structure for processed standings data
interface ProcessedStandings {
  East: (string | number)[][];
  West: (string | number)[][];
  headers: string[];
}

// Import shared types
import type { StreakMap, Game, GamesResponse, RankMap } from "@/types";

export default function Home() {
  const [standings, setStandings] = useState<ProcessedStandings | null>(null);
  const [loadingStandings, setLoadingStandings] = useState<boolean>(true);
  const [errorStandings, setErrorStandings] = useState<string | null>(null);

  // Add state for recent games
  const [recentGames, setRecentGames] = useState<Game[] | null>(null);
  const [loadingGames, setLoadingGames] = useState<boolean>(true);
  const [errorGames, setErrorGames] = useState<string | null>(null);

  // Add state for the streak map
  const [streakMap, setStreakMap] = useState<StreakMap | null>(null);

  // Add state for the rank map
  const [rankMap, setRankMap] = useState<RankMap | null>(null);

  useEffect(() => {
    const fetchStandingsData = async () => {
      setLoadingStandings(true);
      setErrorStandings(null);
      setStreakMap(null); // Reset map on fetch
      setRankMap(null); // Reset rank map
      try {
        // Fetch data from the backend API endpoint
        const response = await axios.get<StandingsResponse>(
          "http://localhost:8000/api/standings"
        );
        const data = response.data;

        if (data.error) {
          throw new Error(`API Error: ${data.error}`);
        }

        // Find the 'Standings' resultSet
        const standingsSet = data.resultSets?.find(
          (rs) => rs.name === "Standings"
        );

        if (!standingsSet) {
          throw new Error("Standings data not found in API response.");
        }

        // Process the rowSet to separate East and West
        // Use the confirmed header name 'Conference'
        const conferenceIndex = standingsSet.headers.indexOf("Conference");
        if (conferenceIndex === -1) {
          throw new Error(
            "'Conference' column not found in standings headers."
          );
        }

        const processed: ProcessedStandings = {
          East: [],
          West: [],
          headers: standingsSet.headers,
        };

        standingsSet.rowSet.forEach((row) => {
          if (row[conferenceIndex] === "East") {
            processed.East.push(row);
          } else if (row[conferenceIndex] === "West") {
            processed.West.push(row);
          }
        });

        // Sort teams within each conference by rank
        // Use the confirmed header name 'PlayoffRank'
        const rankIndex = standingsSet.headers.indexOf("PlayoffRank");
        if (rankIndex === -1) {
          console.warn(
            "'PlayoffRank' column not found, standings might not be sorted correctly."
          );
        } else {
          const sortByRank = (
            a: (string | number)[],
            b: (string | number)[]
          ) => {
            const rankA =
              typeof a[rankIndex] === "number"
                ? (a[rankIndex] as number)
                : Infinity;
            const rankB =
              typeof b[rankIndex] === "number"
                ? (b[rankIndex] as number)
                : Infinity;
            return rankA - rankB;
          };
          processed.East.sort(sortByRank);
          processed.West.sort(sortByRank);
        }

        // --- Create Streak Map AND Rank Map ---
        const teamIdIndex = standingsSet.headers.indexOf("TeamID");
        const streakIndexMap = standingsSet.headers.indexOf("strCurrentStreak");
        const rankIndexMap = standingsSet.headers.indexOf("PlayoffRank"); // Add rank index lookup back

        // Adjust error check
        if (
          teamIdIndex === -1 ||
          streakIndexMap === -1 ||
          rankIndexMap === -1
        ) {
          throw new Error(
            "Required columns (TeamID, strCurrentStreak, PlayoffRank) not found in standings headers for maps."
          );
        }

        const newStreakMap: StreakMap = {};
        const newRankMap: RankMap = {}; // Add rank map init back
        standingsSet.rowSet.forEach((row) => {
          const teamId = row[teamIdIndex];
          const streak = row[streakIndexMap];
          const rank = row[rankIndexMap]; // Add rank get back
          if (typeof teamId === "number") {
            // Populate Streak Map
            if (typeof streak === "string") {
              newStreakMap[teamId] = streak;
            }
            // Populate Rank Map
            if (typeof rank === "number") {
              newRankMap[teamId] = rank;
            }
          }
        });
        setStreakMap(newStreakMap);
        setRankMap(newRankMap); // Add rank map set back
        // --- End Create Maps ---

        // --- Filter Standings to Top 8 ---
        processed.East = processed.East.slice(0, 8);
        processed.West = processed.West.slice(0, 8);
        // --- End Filter Standings ---

        // Set processed standings state (now filtered)
        setStandings(processed);
      } catch (err: unknown) {
        console.error("Error fetching standings:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setErrorStandings(errorMessage);
      } finally {
        setLoadingStandings(false);
      }
    };

    fetchStandingsData();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch Recent Games (separate useEffect)
  useEffect(() => {
    const fetchGamesData = async () => {
      setLoadingGames(true);
      setErrorGames(null);
      try {
        const response = await axios.get<GamesResponse>(
          "http://localhost:8000/api/games/recent"
        );
        if (response.data.error) {
          // Check for backend-reported error first
          throw new Error(`API Error: ${response.data.error}`);
        }
        setRecentGames(response.data.games || []);
      } catch (err: unknown) {
        console.error("Error fetching recent games:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setErrorGames(errorMessage);
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGamesData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-16">
      <h1 className="text-4xl sm:text-5xl font-bold mb-2">NBA Today</h1>
      {/* Simplify description paragraph */}
      <p className="text-muted-foreground text-center mb-10 sm:mb-16">
        Top 8 standings and key upcoming games.
      </p>

      {/* Standings Section */}
      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 self-start max-w-4xl w-full mx-auto">
        Standings
      </h2>
      {/* Standings Loading Skeleton - Use muted background */}
      {loadingStandings && (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Skeleton className="h-[300px] w-full bg-muted" />
          <Skeleton className="h-[300px] w-full bg-muted" />
        </div>
      )}
      {errorStandings && (
        <p className="text-red-500 max-w-4xl w-full mx-auto">
          Error loading standings: {errorStandings}
        </p>
      )}
      {standings && !loadingStandings && !errorStandings && (
        <div className="w-full max-w-4xl flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8 mb-12">
          <div className="w-full lg:w-1/2">
            <StandingsTable
              conferenceName="Eastern"
              standingsData={standings.East}
            />
          </div>
          <div className="w-full lg:w-1/2">
            <StandingsTable
              conferenceName="Western"
              standingsData={standings.West}
            />
          </div>
        </div>
      )}

      {/* --- Icon Legend --- */}
      {/* Render legend only if standings have loaded (so icons are potentially visible) */}
      {standings && !loadingStandings && !errorStandings && <IconLegend />}
      {/* --- End Icon Legend --- */}

      {/* Key Matchups Section */}
      <h2 className="text-2xl sm:text-3xl font-semibold mt-8 mb-1 sm:mb-2 self-start max-w-4xl w-full mx-auto">
        Key Matchups
      </h2>
      {/* Simplify description paragraph */}
      <p className="text-sm text-muted-foreground mb-4 sm:mb-6 self-start max-w-4xl w-full mx-auto">
        Upcoming games between top 4 teams.
      </p>
      {/* Loading/Error checks remain similar */}
      {loadingGames && (
        <div className="w-full max-w-4xl mx-auto mt-12 space-y-6">
          <Skeleton className="h-6 w-2/5 mb-2 bg-muted" />
          <Skeleton className="h-1 w-full mb-4 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full bg-muted" />
            ))}
          </div>
        </div>
      )}
      {errorGames && (
        <p className="text-red-500 max-w-4xl w-full mx-auto">
          Error loading games: {errorGames}
        </p>
      )}
      {/* Filter games before rendering - remove rankMap dependency */}
      {!loadingGames &&
        !errorGames &&
        recentGames &&
        streakMap &&
        rankMap && // Add rankMap check back
        (() => {
          // Restore filtering logic
          const TOP_RANK_THRESHOLD = 4;
          const keyMatchups = recentGames.filter((game) => {
            const visitorRank = game.visitor_team?.TEAM_ID
              ? rankMap[game.visitor_team.TEAM_ID]
              : null;
            const homeRank = game.home_team?.TEAM_ID
              ? rankMap[game.home_team.TEAM_ID]
              : null;
            return (
              typeof visitorRank === "number" &&
              typeof homeRank === "number" &&
              visitorRank <= TOP_RANK_THRESHOLD &&
              homeRank <= TOP_RANK_THRESHOLD
            );
          });

          // Restore original message
          if (keyMatchups.length > 0) {
            // Don't pass rankMap down
            return <RecentGames games={keyMatchups} streakMap={streakMap} />;
          } else {
            return (
              <p className="text-muted-foreground max-w-4xl w-full mx-auto">
                No key matchups found in the recent/upcoming schedule.
              </p>
            );
          }
        })()}
      {/* Restore waiting message check */}
      {!loadingGames &&
        !errorGames &&
        recentGames &&
        (!streakMap || !rankMap) && // Check both maps again
        !errorStandings && (
          <p className="text-yellow-600 max-w-4xl w-full mx-auto">
            Games loaded, waiting for standings data...
          </p>
        )}
    </main>
  );
}
