import { useParams } from "react-router";
import GameTable from "./GameTable";
import { Card } from "../components/ui/card";
import { Trophy, Users, Clock } from "lucide-react";

export default function TournamentTable() {
  const { tournamentId } = useParams();

  // Mock tournament data
  const tournamentInfo = {
    name: "Daily Turbo",
    currentLevel: 3,
    nextBreak: "15:30",
    currentBlind: "25/50",
    nextBlind: "50/100",
    timeLeft: "8:45",
    myRank: 23,
    totalPlayers: 89,
    remainingPlayers: 67,
    avgStack: 7500,
    myStack: 8200,
  };

  return (
    <div className="relative min-h-screen">
      {/* Tournament Info Banner */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Tournament</div>
                <div className="font-medium">{tournamentInfo.name}</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-muted-foreground text-xs">Level</div>
                <div className="font-medium font-mono">{tournamentInfo.currentLevel}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Blinds</div>
                <div className="font-medium font-mono">{tournamentInfo.currentBlind}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Next Blinds</div>
                <div className="font-medium font-mono text-accent">{tournamentInfo.nextBlind}</div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-muted-foreground text-xs">Time Left</div>
                  <div className="font-medium font-mono text-primary">{tournamentInfo.timeLeft}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" />
                <div>
                  <div className="text-muted-foreground text-xs">My Rank</div>
                  <div className="font-medium">
                    {tournamentInfo.myRank} / {tournamentInfo.remainingPlayers}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground text-xs">Players</div>
                  <div className="font-medium">
                    {tournamentInfo.remainingPlayers} / {tournamentInfo.totalPlayers}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Table */}
      <div className="pt-16">
        <GameTable />
      </div>

      {/* Tournament Leaderboard (Optional - Hidden by default) */}
      {/* Could add a side panel here showing current rankings */}
    </div>
  );
}
