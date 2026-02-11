import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";

const games = [
  { id: "snake", name: "Snake", description: "Classic snake game" },
  { id: "tetris", name: "Tetris", description: "Block stacking puzzle" },
  { id: "pong", name: "Pong", description: "Classic paddle game" },
  { id: "space-invaders", name: "Space Invaders", description: "Shoot the aliens" },
  { id: "breakout", name: "Breakout", description: "Break all the bricks" },
  { id: "flappy-bird", name: "Flappy Bird", description: "Fly through pipes" },
  { id: "2048", name: "2048", description: "Combine numbers to 2048" },
  { id: "memory", name: "Memory Cards", description: "Match the pairs" },
  { id: "tictactoe", name: "Tic Tac Toe", description: "Three in a row" },
  { id: "connect4", name: "Connect Four", description: "Connect four discs" },
  { id: "sudoku", name: "Sudoku", description: "Number puzzle" },
  { id: "minesweeper", name: "Minesweeper", description: "Find all mines" },
  { id: "solitaire", name: "Solitaire", description: "Card game classic" },
  { id: "chess", name: "Chess", description: "Strategic board game" },
  { id: "checkers", name: "Checkers", description: "Jump and capture" },
  { id: "pacman", name: "Pac-Man", description: "Eat dots, avoid ghosts" },
  { id: "platformer", name: "Platformer", description: "Jump and run" },
  { id: "racing", name: "Racing", description: "Speed racing game" },
  { id: "puzzle", name: "Puzzle", description: "Solve the puzzle" },
  { id: "trivia", name: "Trivia Quiz", description: "Test your knowledge" },
];

export default function Games() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Games</h1>
              <p className="text-sm text-muted-foreground">20 fully functional games with leaderboards</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {game.name}
                    <Trophy className="h-4 w-4 text-primary" />
                  </CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
