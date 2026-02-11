import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SnakeGame, TetrisGame, PongGame, Game2048, MemoryGame, TicTacToeGame, ConnectFourGame, MinesweeperGame, FlappyBirdGame, BreakoutGame, SpaceInvadersGame, SudokuGame, TriviaGame, PuzzleGame } from "@/components/games/AllGames";

export default function GamePlay() {
  const { gameName } = useParams();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const { data: leaderboard } = trpc.games.getLeaderboard.useQuery(
    { gameName: gameName || "" },
    { enabled: !!gameName }
  );

  const submitScoreMutation = trpc.games.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Score submitted!");
    },
  });

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const handleGameOver = (finalScore: number) => {
    setGameOver(true);
    if (finalScore > 0 && gameName) {
      submitScoreMutation.mutate({
        gameName,
        score: finalScore,
      });
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
      default:
        return (
          <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                {getGameTitle()} game coming soon!
              </p>
              <p className="text-sm text-muted-foreground">
                This game is being developed and will be available shortly.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/games">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{getGameTitle()}</h1>
              <p className="text-sm text-muted-foreground">Score: {score}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Game</CardTitle>
                <CardDescription>
                  {gameOver && <span className="text-primary font-semibold">Game Over! Final Score: {score}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {renderGame()}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top 10 scores</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2 rounded bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">#{index + 1}</span>
                          <span className="text-sm">{entry.userName || "Anonymous"}</span>
                        </div>
                        <span className="font-semibold">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No scores yet. Be the first!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
