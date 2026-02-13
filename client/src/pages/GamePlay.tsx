import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { ArrowLeft, Share2, Trophy, Users, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SnakeGame, TetrisGame, PongGame, Game2048, MemoryGame, TicTacToeGame, ConnectFourGame, MinesweeperGame, FlappyBirdGame, BreakoutGame, SpaceInvadersGame, SudokuGame, TriviaGame, PuzzleGame, PacManGame, RacingGame, PlatformerGame, SolitaireGame, ChessGame, CheckersGame } from "@/components/games/AllGames";

export default function GamePlay() {
  const { gameName } = useParams();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [activePowerUps, setActivePowerUps] = useState<any[]>([]);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  
  // Detect challenge parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challenge = params.get('challenge');
    if (challenge) {
      const targetScore = parseInt(challenge, 10);
      if (!isNaN(targetScore)) {
        setChallengeScore(targetScore);
        toast.info(`Challenge accepted! Beat the score of ${targetScore} points!`, {
          duration: 5000,
        });
      }
    }
  }, []);

  const { data: leaderboard } = trpc.games.getLeaderboard.useQuery(
    { gameName: gameName || "" },
    { enabled: !!gameName }
  );

  const checkAchievementsMutation = trpc.achievements.checkAndUnlock.useMutation({
    onSuccess: (newAchievements) => {
      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach((achievement: any) => {
          toast.success(`🏆 Achievement Unlocked: ${achievement.name}`, {
            description: `${achievement.description} (+${achievement.points} points)`,
            duration: 8000,
          });
        });
      }
    },
  });

  const { data: powerUps } = trpc.powerups.getActive.useQuery();
  
  const submitScoreMutation = trpc.games.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Score submitted!");
      // Check for new achievements after submitting score
      checkAchievementsMutation.mutate();
    },
  });
  
  // Load active power-ups
  useEffect(() => {
    if (powerUps) {
      setActivePowerUps(powerUps);
      // Apply score multiplier if Score Multiplier boost is active
      const hasScoreMultiplier = powerUps.some((p: any) => p.powerUpType === 'score_multiplier');
      setScoreMultiplier(hasScoreMultiplier ? 1.5 : 1);
    }
  }, [powerUps]);

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const handleGameOver = (finalScore: number) => {
    setGameOver(true);
    if (finalScore > 0 && gameName) {
      // Apply score multiplier and award Bits
      const adjustedScore = Math.floor(finalScore * scoreMultiplier);
      const bitsEarned = Math.floor(adjustedScore / 100);
      
      submitScoreMutation.mutate({
        gameName,
        score: adjustedScore,
        bitsEarned,
      });
      
      if (bitsEarned > 0) {
        toast.success(`+${bitsEarned} Bits earned!`, {
          description: `Score: ${adjustedScore}${scoreMultiplier > 1 ? ' (with multiplier)' : ''}`,
          duration: 4000,
        });
      }
      
      // Check if challenge was beaten
      if (challengeScore && finalScore > challengeScore) {
        toast.success(`🎉 Challenge completed! You beat the score of ${challengeScore}!`, {
          duration: 7000,
        });
      } else if (challengeScore && finalScore <= challengeScore) {
        toast.error(`Almost! You scored ${finalScore} but needed ${challengeScore + 1} to win.`, {
          duration: 5000,
        });
      }
    }
  };

  const getGameTitle = () => {
    const titles: Record<string, string> = {
      snake: "Snake",
      tetris: "Tetris",
      pong: "Pong",
      "space-invaders": "Space Invaders",
      breakout: "Breakout",
      "flappy-bird": "Flappy Bird",
      "2048": "2048",
      memory: "Memory Cards",
      tictactoe: "Tic Tac Toe",
      connect4: "Connect Four",
      sudoku: "Sudoku",
      minesweeper: "Minesweeper",
      solitaire: "Solitaire",
      chess: "Chess",
      checkers: "Checkers",
      pacman: "Pac-Man",
      platformer: "Platformer",
      racing: "Racing",
      puzzle: "Puzzle",
      trivia: "Trivia Quiz",
    };
    return titles[gameName || ""] || "Game";
  };

  const renderGame = () => {
    switch (gameName) {
      case "snake":
        return <SnakeGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "tetris":
        return <TetrisGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "pong":
        return <PongGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "2048":
        return <Game2048 onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "memory":
        return <MemoryGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "tictactoe":
        return <TicTacToeGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "connect4":
        return <ConnectFourGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "minesweeper":
        return <MinesweeperGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "flappy-bird":
        return <FlappyBirdGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "breakout":
        return <BreakoutGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "space-invaders":
        return <SpaceInvadersGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "sudoku":
        return <SudokuGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "trivia":
        return <TriviaGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "puzzle":
        return <PuzzleGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "pacman":
        return <PacManGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "racing":
        return <RacingGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "platformer":
        return <PlatformerGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "solitaire":
        return <SolitaireGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "chess":
        return <ChessGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      case "checkers":
        return <CheckersGame onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} />;
      default:
        return <div>Game not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/games">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{getGameTitle()}</h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Trophy className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">{score}</p>
                </div>
                {challengeScore && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                    <Target className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-600">
                      Beat {challengeScore}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">{renderGame()}</CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Social Actions */}
            {score > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Your Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/games/${gameName}?challenge=${score}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Challenge link copied! Share it with friends.');
                    }}
                    variant="outline" 
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Score ({score})
                  </Button>
                  <Button 
                    onClick={() => {
                      const text = `I just scored ${score} points in ${getGameTitle()}! Can you beat my score?`;
                      navigator.clipboard.writeText(text);
                      toast.success('Score text copied to clipboard!');
                    }}
                    variant="outline" 
                    className="w-full"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Copy Score Text
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Global Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Global Leaderboard
                </CardTitle>
                <CardDescription>Top 10 players worldwide</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            index === 2 ? 'text-amber-600' : 
                            'text-primary'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm">{entry.userName || 'Anonymous'}</span>
                        </div>
                        <span className="font-semibold">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No scores yet. Be the first!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
