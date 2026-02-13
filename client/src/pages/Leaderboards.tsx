import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Leaderboards() {
  const { isAuthenticated } = useAuth();
  const [period, setPeriod] = useState<"all" | "weekly" | "monthly">("all");
  
  const { data: leaderboards, isLoading } = trpc.leaderboards.getAll.useQuery({ period });

  const games = [
    "snake", "tetris", "pong", "2048", "memory", "tictactoe", "connect4",
    "minesweeper", "flappybird", "breakout", "spaceinvaders", "sudoku",
    "trivia", "puzzle", "pacman", "racing", "platformer", "solitaire",
    "chess", "checkers"
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600";
    if (rank === 2) return "bg-gray-400/10 border-gray-400/20 text-gray-600";
    if (rank === 3) return "bg-amber-600/10 border-amber-600/20 text-amber-600";
    return "bg-muted/50 border-border";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Global Leaderboards
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Top players across all games
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex gap-2 mb-6">
          <Button
            variant={period === "all" ? "default" : "outline"}
            onClick={() => setPeriod("all")}
          >
            All Time
          </Button>
          <Button
            variant={period === "weekly" ? "default" : "outline"}
            onClick={() => setPeriod("weekly")}
          >
            This Week
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "outline"}
            onClick={() => setPeriod("monthly")}
          >
            This Month
          </Button>
        </div>

        <Tabs defaultValue="snake" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="snake">Snake</TabsTrigger>
            <TabsTrigger value="tetris">Tetris</TabsTrigger>
            <TabsTrigger value="2048">2048</TabsTrigger>
            <TabsTrigger value="flappybird">Flappy Bird</TabsTrigger>
            <TabsTrigger value="all">All Games</TabsTrigger>
          </TabsList>

          {games.slice(0, 4).map((game) => (
            <TabsContent key={game} value={game}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {game.charAt(0).toUpperCase() + game.slice(1)} Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top 10 players {period === "weekly" ? "this week" : period === "monthly" ? "this month" : "of all time"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading...</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboards?.[game]?.slice(0, 10).map((entry: any, index: number) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${getRankBadge(index + 1)}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 flex justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                            <div>
                              <p className="font-semibold">{entry.userName || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">{entry.score.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      )) || <p className="text-center text-muted-foreground py-8">No scores yet</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map((game) => (
                <Card key={game}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{game}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {leaderboards?.[game]?.slice(0, 3).map((entry: any, index: number) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-2 rounded border border-border"
                        >
                          <div className="flex items-center gap-2">
                            {getRankIcon(index + 1)}
                            <span className="text-sm font-medium">{entry.userName || "Anonymous"}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">{entry.score.toLocaleString()}</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground text-center py-4">No scores</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
