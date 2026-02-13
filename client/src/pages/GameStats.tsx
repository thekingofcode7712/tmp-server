import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Trophy, TrendingUp, Target, Award, Medal, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GameStats() {
  const { data: userScores, isLoading: scoresLoading } = trpc.games.getUserScores.useQuery({});
  const { data: achievements, isLoading: achievementsLoading } = trpc.achievements.getUserAchievements.useQuery();
  const { data: achievementStats } = trpc.achievements.getStats.useQuery();

  // Calculate statistics
  const totalGames = userScores?.length || 0;
  const totalScore = userScores?.reduce((sum, score) => sum + score.score, 0) || 0;
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const highScore = userScores?.reduce((max, score) => Math.max(max, score.score), 0) || 0;
  
  // Get unique games played
  const uniqueGames = new Set(userScores?.map(s => s.gameName)).size;
  
  // Get recent achievements (last 5)
  const recentAchievements = achievements?.slice(0, 5) || [];

  if (scoresLoading || achievementsLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Statistics</h1>
        <p className="text-muted-foreground">Track your gaming performance and achievements</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueGames} unique games
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highScore.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all games
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievementStats?.unlocked || 0}/{achievementStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {achievementStats?.points || 0} points earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
          <CardDescription>Your latest unlocked achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{achievement.name}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Star className="w-3 h-3 mr-1" />
                      {achievement.points} pts
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No achievements unlocked yet. Keep playing to earn your first achievement!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Game Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Game Performance</CardTitle>
          <CardDescription>Your scores across different games</CardDescription>
        </CardHeader>
        <CardContent>
          {userScores && userScores.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(
                userScores.reduce((acc, score) => {
                  if (!acc[score.gameName]) {
                    acc[score.gameName] = { count: 0, total: 0, best: 0 };
                  }
                  acc[score.gameName].count++;
                  acc[score.gameName].total += score.score;
                  acc[score.gameName].best = Math.max(acc[score.gameName].best, score.score);
                  return acc;
                }, {} as Record<string, { count: number; total: number; best: number }>)
              )
                .sort((a, b) => b[1].best - a[1].best)
                .slice(0, 10)
                .map(([gameName, stats]) => (
                  <div
                    key={gameName}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <div className="font-medium capitalize">{gameName.replace(/-/g, ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.count} games played • Avg: {Math.round(stats.total / stats.count)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{stats.best.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Best score</div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No games played yet. Start playing to see your statistics!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
