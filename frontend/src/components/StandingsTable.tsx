"use client"; // This component will fetch/process data client-side initially

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Use ShadCN Table components
import { Flame, Snowflake } from "lucide-react";

// Define the expected structure of a row in standingsData
// Based on confirmed indices from nba_api response
// TeamID: 2, TeamCity: 3, TeamName: 4, Conference: 6
// PlayoffRank: 8, WINS: 13, LOSSES: 14, WinPCT: 15, ConferenceGamesBack: 38
// strCurrentStreak: 37
type StandingRow = (string | number)[];

interface StandingsTableProps {
  conferenceName: string;
  standingsData: StandingRow[];
}

// Helper to safely access row data, returning '-' if index is out of bounds or data is unexpected
const getCellData = (row: StandingRow, index: number): string | number => {
  return row?.[index] ?? "-";
};

export function StandingsTable({
  conferenceName,
  standingsData,
}: StandingsTableProps) {
  if (!standingsData || standingsData.length === 0) {
    return <div>No standings data available for {conferenceName}.</div>;
  }

  // Define column headers and the index in the row data they correspond to
  const columns = [
    { header: "Rank", index: 8 }, // PlayoffRank
    { header: "Team", index: 4 }, // TeamName (will combine with TeamCity)
    { header: "W", index: 13 }, // WINS
    { header: "L", index: 14 }, // LOSSES
    { header: "PCT", index: 15 }, // WinPCT
    { header: "GB", index: 38 }, // ConferenceGamesBack
    { header: "Streak", index: 37 }, // strCurrentStreak
  ];

  // Define the threshold for showing streak icons
  const STREAK_THRESHOLD = 3;

  return (
    <div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted/80 border-b">
              {columns.map((col) => (
                <TableHead
                  key={col.header}
                  className={`${
                    col.header === "Team" ? "text-left" : "text-center"
                  } ${
                    col.header === "GB" || col.header === "Streak"
                      ? "hidden sm:table-cell"
                      : ""
                  }`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {standingsData.map((teamRow, rowIndex) => {
              // Generate a unique key for the row, using TeamID (index 2)
              const teamId = getCellData(teamRow, 2);
              const rowKey =
                teamId !== "-"
                  ? `standing-${teamId}`
                  : `standing-row-${rowIndex}`;

              // Get Team City (index 3) and Name (index 4)
              const teamCity = getCellData(teamRow, 3);
              const teamName = getCellData(teamRow, 4);
              const fullTeamName =
                teamCity !== "-" && teamName !== "-"
                  ? `${teamCity} ${teamName}`
                  : teamName; // Combine if city exists

              return (
                <TableRow
                  key={rowKey}
                  className="hover:bg-muted/50 even:bg-muted/50"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={`${rowKey}-${col.header}`}
                      className={`${
                        col.header === "Team"
                          ? "text-left font-medium"
                          : "text-center"
                      } ${
                        col.header === "GB" || col.header === "Streak"
                          ? "hidden sm:table-cell"
                          : ""
                      }`}
                    >
                      {/* Render Team Name (and potentially icon) */}
                      {col.header === "Team" ? (
                        <span className="inline-flex items-center space-x-1.5">
                          <span>{fullTeamName}</span>
                          {(() => {
                            const streakValue = getCellData(teamRow, 37);
                            if (typeof streakValue === "string") {
                              const match = streakValue.match(/([WL])\s*(\d+)/);
                              if (match) {
                                const type = match[1];
                                const count = parseInt(match[2], 10);
                                if (count >= STREAK_THRESHOLD) {
                                  const Icon = type === "W" ? Flame : Snowflake;
                                  const iconColor =
                                    type === "W"
                                      ? "text-orange-500"
                                      : "text-blue-400";
                                  return (
                                    <Icon className={`h-4 w-4 ${iconColor}`} />
                                  );
                                }
                              }
                            }
                            return null;
                          })()}
                        </span>
                      ) : /* Render Streak value (no icon logic needed here anymore) */
                      col.header === "Streak" ? (
                        getCellData(teamRow, col.index)
                      ) : (
                        /* Render other cell data */
                        getCellData(teamRow, col.index)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
