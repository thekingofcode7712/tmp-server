import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GamePlay() {
  const { gameName } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const { data: leaderboard } = trpc.games.getLeaderboard.useQuery(
    { gameName: gameName || "" },
    { enabled: !!gameName }
  );

  const submitScoreMutation = trpc.games.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Score submitted!");
    },
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted || gameName !== "snake") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 0;
    let dy = 0;
    let currentScore = 0;

    const drawGame = () => {
      // Clear canvas
      ctx.fillStyle = "oklch(var(--background))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw snake
      ctx.fillStyle = "oklch(var(--primary))";
      snake.forEach((segment) => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });

      // Draw food
      ctx.fillStyle = "oklch(var(--destructive))";
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    };

    const moveSnake = () => {
      if (dx === 0 && dy === 0) return;

      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      // Check wall collision
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
      }

      // Check self collision
      if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
      }

      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        currentScore += 10;
        setScore(currentScore);
        food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        };
      } else {
        snake.pop();
      }
    };

    const endGame = () => {
      setGameOver(true);
      setGameStarted(false);
      if (currentScore > 0) {
        submitScoreMutation.mutate({
          gameName: gameName || "",
          score: currentScore,
        });
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (dy === 0) {
            dx = 0;
            dy = -1;
          }
          break;
        case "ArrowDown":
          if (dy === 0) {
            dx = 0;
            dy = 1;
          }
          break;
        case "ArrowLeft":
          if (dx === 0) {
            dx = -1;
            dy = 0;
          }
          break;
        case "ArrowRight":
          if (dx === 0) {
            dx = 1;
            dy = 0;
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    const gameLoop = setInterval(() => {
      moveSnake();
      drawGame();
    }, 100);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [gameStarted, gameName]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
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
                  {gameName === "snake" ? "Use arrow keys to control the snake" : "Game controls will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {gameName === "snake" ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={400}
                      className="game-canvas"
                    />
                    {!gameStarted && (
                      <Button onClick={startGame} size="lg">
                        {gameOver ? "Play Again" : "Start Game"}
                      </Button>
                    )}
                    {gameOver && (
                      <p className="text-lg font-semibold">Game Over! Final Score: {score}</p>
                    )}
                  </>
                ) : (
                  <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                      {getGameTitle()} game will be implemented here
                    </p>
                  </div>
                )}
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
