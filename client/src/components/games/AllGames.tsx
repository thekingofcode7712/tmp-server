import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Snake Game Component
export function SnakeGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    dx: 0,
    dy: 0,
    score: 0,
    gameOver: false,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    const state = gameStateRef.current;

    const drawGame = () => {
      ctx.fillStyle = "oklch(0.15 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw snake
      ctx.fillStyle = "oklch(0.65 0.25 142)";
      state.snake.forEach((segment, index) => {
        if (index === 0) ctx.fillStyle = "oklch(0.75 0.25 142)";
        else ctx.fillStyle = "oklch(0.65 0.25 142)";
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });

      // Draw food
      ctx.fillStyle = "oklch(0.65 0.25 29)";
      ctx.fillRect(state.food.x * gridSize, state.food.y * gridSize, gridSize - 2, gridSize - 2);
    };

    const moveSnake = () => {
      if (state.dx === 0 && state.dy === 0) return;

      const head = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };

      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        state.gameOver = true;
        setGameStarted(false);
        onGameOver(state.score);
        return;
      }

      if (state.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        state.gameOver = true;
        setGameStarted(false);
        onGameOver(state.score);
        return;
      }

      state.snake.unshift(head);

      if (head.x === state.food.x && head.y === state.food.y) {
        state.score += 10;
        onScoreUpdate(state.score);
        state.food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        };
      } else {
        state.snake.pop();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (state.dy === 0) {
            state.dx = 0;
            state.dy = -1;
          }
          break;
        case "ArrowDown":
          if (state.dy === 0) {
            state.dx = 0;
            state.dy = 1;
          }
          break;
        case "ArrowLeft":
          if (state.dx === 0) {
            state.dx = -1;
            state.dy = 0;
          }
          break;
        case "ArrowRight":
          if (state.dx === 0) {
            state.dx = 1;
            state.dy = 0;
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
  }, [gameStarted]);

  const startGame = () => {
    gameStateRef.current = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      dx: 0,
      dy: 0,
      score: 0,
      gameOver: false,
    };
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-border rounded" />
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          {gameStateRef.current.gameOver ? "Play Again" : "Start Game"}
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Use arrow keys to control the snake</p>
    </div>
  );
}

// Tetris Game Component
export function TetrisGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    board: Array(20).fill(null).map(() => Array(10).fill(0)),
    currentPiece: { shape: [[1, 1], [1, 1]], x: 4, y: 0, color: 1 },
    score: 0,
    gameOver: false,
  });

  const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
  ];

  const COLORS = ["#000", "#00f0f0", "#f0f000", "#a000f0", "#f0a000", "#0000f0", "#00f000", "#f00000"];

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const blockSize = 30;
    const state = gameStateRef.current;

    const drawBoard = () => {
      ctx.fillStyle = "oklch(0.15 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw placed blocks
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          if (state.board[y][x]) {
            ctx.fillStyle = COLORS[state.board[y][x]];
            ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
          }
        }
      }

      // Draw current piece
      const piece = state.currentPiece;
      ctx.fillStyle = COLORS[piece.color];
      piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
          if (value) {
            ctx.fillRect(
              (piece.x + dx) * blockSize,
              (piece.y + dy) * blockSize,
              blockSize - 1,
              blockSize - 1
            );
          }
        });
      });
    };

    const checkCollision = (piece: any, offsetX = 0, offsetY = 0) => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.x + x + offsetX;
            const newY = piece.y + y + offsetY;
            if (newX < 0 || newX >= 10 || newY >= 20) return true;
            if (newY >= 0 && state.board[newY][newX]) return true;
          }
        }
      }
      return false;
    };

    const mergePiece = () => {
      const piece = state.currentPiece;
      piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
          if (value) {
            const y = piece.y + dy;
            const x = piece.x + dx;
            if (y >= 0) state.board[y][x] = piece.color;
          }
        });
      });
    };

    const clearLines = () => {
      let linesCleared = 0;
      for (let y = 19; y >= 0; y--) {
        if (state.board[y].every((cell) => cell !== 0)) {
          state.board.splice(y, 1);
          state.board.unshift(Array(10).fill(0));
          linesCleared++;
          y++;
        }
      }
      if (linesCleared > 0) {
        state.score += linesCleared * 100;
        onScoreUpdate(state.score);
      }
    };

    const newPiece = () => {
      const shapeIndex = Math.floor(Math.random() * SHAPES.length);
      state.currentPiece = {
        shape: SHAPES[shapeIndex],
        x: 4,
        y: 0,
        color: shapeIndex + 1,
      };
      if (checkCollision(state.currentPiece)) {
        state.gameOver = true;
        setGameStarted(false);
        onGameOver(state.score);
      }
    };

    const drop = () => {
      if (!checkCollision(state.currentPiece, 0, 1)) {
        state.currentPiece.y++;
      } else {
        mergePiece();
        clearLines();
        newPiece();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && !checkCollision(state.currentPiece, -1, 0)) {
        state.currentPiece.x--;
      } else if (e.key === "ArrowRight" && !checkCollision(state.currentPiece, 1, 0)) {
        state.currentPiece.x++;
      } else if (e.key === "ArrowDown") {
        drop();
      } else if (e.key === "ArrowUp") {
        // Rotate
        const rotated = state.currentPiece.shape[0].map((_, i) =>
          state.currentPiece.shape.map((row) => row[i]).reverse()
        );
        const oldShape = state.currentPiece.shape;
        state.currentPiece.shape = rotated;
        if (checkCollision(state.currentPiece)) {
          state.currentPiece.shape = oldShape;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    const gameLoop = setInterval(() => {
      drop();
      drawBoard();
    }, 500);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [gameStarted]);

  const startGame = () => {
    gameStateRef.current = {
      board: Array(20).fill(null).map(() => Array(10).fill(0)),
      currentPiece: { shape: SHAPES[0], x: 4, y: 0, color: 1 },
      score: 0,
      gameOver: false,
    };
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={300} height={600} className="border-2 border-border rounded" />
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          {gameStateRef.current.gameOver ? "Play Again" : "Start Game"}
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Arrow keys: Left/Right to move, Up to rotate, Down to drop</p>
    </div>
  );
}

// Pong Game Component
export function PongGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    paddleY: 150,
    aiPaddleY: 150,
    ballX: 300,
    ballY: 200,
    ballDX: 3,
    ballDY: 3,
    score: 0,
    aiScore: 0,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const paddleHeight = 80;
    const paddleWidth = 10;

    const draw = () => {
      ctx.fillStyle = "oklch(0.15 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      ctx.fillStyle = "oklch(0.75 0.25 142)";
      ctx.fillRect(10, state.paddleY, paddleWidth, paddleHeight);
      ctx.fillRect(canvas.width - 20, state.aiPaddleY, paddleWidth, paddleHeight);

      // Draw ball
      ctx.fillStyle = "oklch(0.85 0 0)";
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw score
      ctx.fillStyle = "oklch(0.85 0 0)";
      ctx.font = "24px monospace";
      ctx.fillText(`${state.score} : ${state.aiScore}`, canvas.width / 2 - 30, 30);
    };

    const update = () => {
      // Move ball
      state.ballX += state.ballDX;
      state.ballY += state.ballDY;

      // Ball collision with top/bottom
      if (state.ballY <= 0 || state.ballY >= canvas.height) {
        state.ballDY = -state.ballDY;
      }

      // Ball collision with paddles
      if (
        state.ballX <= 20 &&
        state.ballY >= state.paddleY &&
        state.ballY <= state.paddleY + paddleHeight
      ) {
        state.ballDX = -state.ballDX;
        state.score += 10;
        onScoreUpdate(state.score);
      }

      if (
        state.ballX >= canvas.width - 20 &&
        state.ballY >= state.aiPaddleY &&
        state.ballY <= state.aiPaddleY + paddleHeight
      ) {
        state.ballDX = -state.ballDX;
      }

      // Score points
      if (state.ballX <= 0) {
        state.aiScore++;
        state.ballX = 300;
        state.ballY = 200;
      }

      if (state.ballX >= canvas.width) {
        state.score += 10;
        onScoreUpdate(state.score);
        state.ballX = 300;
        state.ballY = 200;
      }

      // AI movement
      if (state.aiPaddleY + paddleHeight / 2 < state.ballY) {
        state.aiPaddleY += 2;
      } else {
        state.aiPaddleY -= 2;
      }

      // Check game over
      if (state.aiScore >= 5) {
        setGameStarted(false);
        onGameOver(state.score);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.paddleY = e.clientY - rect.top - paddleHeight / 2;
      state.paddleY = Math.max(0, Math.min(canvas.height - paddleHeight, state.paddleY));
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const gameLoop = setInterval(() => {
      update();
      draw();
    }, 1000 / 60);

    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameStarted]);

  const startGame = () => {
    gameStateRef.current = {
      paddleY: 150,
      aiPaddleY: 150,
      ballX: 300,
      ballY: 200,
      ballDX: 3,
      ballDY: 3,
      score: 0,
      aiScore: 0,
    };
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={600} height={400} className="border-2 border-border rounded" />
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Move your mouse to control the paddle. First to 5 points wins!</p>
    </div>
  );
}

// 2048 Game Component
export function Game2048({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [board, setBoard] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const initBoard = () => {
    const newBoard = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    onScoreUpdate(0);
    setGameStarted(true);
  };

  const addRandomTile = (board: number[][]) => {
    const empty: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) empty.push([i, j]);
      }
    }
    if (empty.length > 0) {
      const [i, j] = empty[Math.floor(Math.random() * empty.length)];
      board[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const move = (direction: string) => {
    if (!gameStarted) return;

    const newBoard = board.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const moveLeft = () => {
      for (let i = 0; i < 4; i++) {
        const row = newBoard[i].filter(x => x !== 0);
        for (let j = 0; j < row.length - 1; j++) {
          if (row[j] === row[j + 1]) {
            row[j] *= 2;
            newScore += row[j];
            row.splice(j + 1, 1);
          }
        }
        while (row.length < 4) row.push(0);
        if (JSON.stringify(row) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = row;
      }
    };

    const transpose = () => {
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          [newBoard[i][j], newBoard[j][i]] = [newBoard[j][i], newBoard[i][j]];
        }
      }
    };

    const reverse = () => {
      newBoard.forEach(row => row.reverse());
    };

    if (direction === "left") moveLeft();
    else if (direction === "right") { reverse(); moveLeft(); reverse(); }
    else if (direction === "up") { transpose(); moveLeft(); transpose(); }
    else if (direction === "down") { transpose(); reverse(); moveLeft(); reverse(); transpose(); }

    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      onScoreUpdate(newScore);

      // Check game over
      const hasEmpty = newBoard.some(row => row.includes(0));
      const canMerge = newBoard.some((row, i) =>
        row.some((cell, j) =>
          (j < 3 && cell === row[j + 1]) || (i < 3 && cell === newBoard[i + 1][j])
        )
      );
      if (!hasEmpty && !canMerge) {
        onGameOver(newScore);
        setGameStarted(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      if (e.key === "ArrowLeft") move("left");
      else if (e.key === "ArrowRight") move("right");
      else if (e.key === "ArrowUp") move("up");
      else if (e.key === "ArrowDown") move("down");
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, board, score]);

  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: "oklch(0.25 0 0)",
      2: "oklch(0.85 0.05 85)",
      4: "oklch(0.82 0.08 75)",
      8: "oklch(0.75 0.15 35)",
      16: "oklch(0.70 0.18 30)",
      32: "oklch(0.65 0.20 25)",
      64: "oklch(0.60 0.22 20)",
      128: "oklch(0.75 0.20 85)",
      256: "oklch(0.72 0.22 80)",
      512: "oklch(0.70 0.24 75)",
      1024: "oklch(0.68 0.26 70)",
      2048: "oklch(0.65 0.28 65)",
    };
    return colors[value] || "oklch(0.50 0.30 60)";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2 p-4 bg-muted rounded-lg">
        {board.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="w-20 h-20 flex items-center justify-center text-2xl font-bold rounded"
              style={{ backgroundColor: getTileColor(cell), color: cell > 4 ? "#fff" : "#000" }}
            >
              {cell || ""}
            </div>
          ))
        )}
      </div>
      {!gameStarted && (
        <Button onClick={initBoard} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Use arrow keys to move tiles. Combine same numbers to reach 2048!</p>
    </div>
  );
}

// Memory Cards Game Component
export function MemoryGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [cards, setCards] = useState<{ id: number; value: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const symbols = ["🎮", "🎯", "🎲", "🎪", "🎨", "🎭", "🎬", "🎤"];

  const initGame = () => {
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((value, id) => ({ id, value, flipped: false, matched: false }));
    setCards(deck);
    setMoves(0);
    setFlippedIndices([]);
    onScoreUpdate(0);
    setGameStarted(true);
  };

  const handleCardClick = (index: number) => {
    if (!gameStarted || flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;

      if (newCards[first].value === newCards[second].value) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setFlippedIndices([]);

        const score = (moves + 1) * 10;
        onScoreUpdate(score);

        if (newCards.every(card => card.matched)) {
          setTimeout(() => {
            onGameOver(score);
            setGameStarted(false);
          }, 500);
        }
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            className="w-20 h-20 text-3xl rounded-lg border-2 border-border transition-all"
            style={{
              backgroundColor: card.flipped || card.matched ? "oklch(0.65 0.25 142)" : "oklch(0.35 0 0)",
              transform: card.flipped || card.matched ? "rotateY(0deg)" : "rotateY(180deg)",
            }}
          >
            {(card.flipped || card.matched) ? card.value : "?"}
          </button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">Moves: {moves}</div>
      {!gameStarted && (
        <Button onClick={initGame} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Click cards to flip and match pairs!</p>
    </div>
  );
}

// Tic Tac Toe Game Component
export function TicTacToeGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const minimax = (board: (string | null)[], isMaximizing: boolean): number => {
    const winner = calculateWinner(board);
    if (winner === "O") return 10;
    if (winner === "X") return -10;
    if (board.every(cell => cell !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "O";
          const score = minimax(board, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "X";
          const score = minimax(board, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (board: (string | null)[]) => {
    let bestScore = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const score = minimax(board, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const handleClick = (index: number) => {
    if (!gameStarted || board[index] || calculateWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const winner = calculateWinner(newBoard);
    if (winner === "X") {
      const newScore = score + 100;
      setScore(newScore);
      onScoreUpdate(newScore);
      setTimeout(() => {
        onGameOver(newScore);
        setGameStarted(false);
      }, 500);
      return;
    }

    if (newBoard.every(cell => cell !== null)) {
      onGameOver(score);
      setGameStarted(false);
      return;
    }

    // AI move
    setTimeout(() => {
      const aiMove = getBestMove(newBoard);
      if (aiMove !== -1) {
        newBoard[aiMove] = "O";
        setBoard([...newBoard]);

        const aiWinner = calculateWinner(newBoard);
        if (aiWinner === "O") {
          setTimeout(() => {
            onGameOver(score);
            setGameStarted(false);
          }, 500);
        } else if (newBoard.every(cell => cell !== null)) {
          onGameOver(score);
          setGameStarted(false);
        }
      }
    }, 500);
  };

  const startGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setScore(0);
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className="w-24 h-24 text-4xl font-bold border-2 border-border rounded-lg bg-card hover:bg-muted transition-colors"
          >
            {cell}
          </button>
        ))}
      </div>
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">You are X. Beat the AI to win!</p>
    </div>
  );
}

// Connect Four Game Component
export function ConnectFourGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(7).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);

  const checkWinner = (board: number[][], row: number, col: number, player: number) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const dropPiece = (col: number) => {
    if (!gameStarted || winner || currentPlayer !== 1) return;

    const newBoard = board.map(row => [...row]);
    for (let row = 5; row >= 0; row--) {
      if (newBoard[row][col] === 0) {
        newBoard[row][col] = 1;
        setBoard(newBoard);

        if (checkWinner(newBoard, row, col, 1)) {
          setWinner(1);
          const finalScore = score + 100;
          setScore(finalScore);
          onScoreUpdate(finalScore);
          setTimeout(() => {
            onGameOver(finalScore);
            setGameStarted(false);
          }, 1000);
          return;
        }

        setCurrentPlayer(2);
        
        // AI move
        setTimeout(() => {
          const aiCol = Math.floor(Math.random() * 7);
          for (let row = 5; row >= 0; row--) {
            if (newBoard[row][aiCol] === 0) {
              newBoard[row][aiCol] = 2;
              setBoard([...newBoard]);

              if (checkWinner(newBoard, row, aiCol, 2)) {
                setWinner(2);
                setTimeout(() => {
                  onGameOver(score);
                  setGameStarted(false);
                }, 1000);
                return;
              }

              setCurrentPlayer(1);
              break;
            }
          }
        }, 500);
        return;
      }
    }
  };

  const startGame = () => {
    setBoard(Array(6).fill(null).map(() => Array(7).fill(0)));
    setCurrentPlayer(1);
    setScore(0);
    setWinner(null);
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-rows-6 gap-1 p-4 bg-primary/20 rounded-lg">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-7 gap-1">
            {row.map((cell, colIdx) => (
              <button
                key={colIdx}
                onClick={() => dropPiece(colIdx)}
                className="w-12 h-12 rounded-full border-2 border-border transition-colors"
                style={{
                  backgroundColor: cell === 0 ? "oklch(0.25 0 0)" : cell === 1 ? "oklch(0.65 0.25 29)" : "oklch(0.65 0.25 250)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {winner && (
        <p className="text-lg font-semibold">
          {winner === 1 ? "You Win!" : "AI Wins!"}
        </p>
      )}
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Click columns to drop pieces. Connect 4 to win!</p>
    </div>
  );
}

// Minesweeper Game Component
export function MinesweeperGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [board, setBoard] = useState<{ mine: boolean; revealed: boolean; flagged: boolean; adjacent: number }[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);

  const initBoard = () => {
    const size = 10;
    const mineCount = 15;
    const newBoard = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );

    // Place mines
    let placed = 0;
    while (placed < mineCount) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (!newBoard[row][col].mine) {
        newBoard[row][col].mine = true;
        placed++;
      }
    }

    // Calculate adjacent mines
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!newBoard[i][j].mine) {
          let count = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < size && nj >= 0 && nj < size && newBoard[ni][nj].mine) {
                count++;
              }
            }
          }
          newBoard[i][j].adjacent = count;
        }
      }
    }

    setBoard(newBoard);
    setScore(0);
    onScoreUpdate(0);
    setGameStarted(true);
  };

  const revealCell = (row: number, col: number) => {
    if (!gameStarted || board[row][col].revealed || board[row][col].flagged) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    
    if (newBoard[row][col].mine) {
      newBoard[row][col].revealed = true;
      setBoard(newBoard);
      setTimeout(() => {
        onGameOver(score);
        setGameStarted(false);
      }, 500);
      return;
    }

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
      if (newBoard[r][c].revealed || newBoard[r][c].flagged) return;
      
      newBoard[r][c].revealed = true;
      
      if (newBoard[r][c].adjacent === 0) {
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            reveal(r + di, c + dj);
          }
        }
      }
    };

    reveal(row, col);
    setBoard(newBoard);

    const newScore = score + 10;
    setScore(newScore);
    onScoreUpdate(newScore);

    // Check win
    const allRevealed = newBoard.every((row, i) =>
      row.every((cell, j) => cell.revealed || cell.mine)
    );
    if (allRevealed) {
      setTimeout(() => {
        onGameOver(newScore);
        setGameStarted(false);
      }, 500);
    }
  };

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!gameStarted || board[row][col].revealed) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {board.length > 0 && (
        <div className="grid gap-1">
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1">
              {row.map((cell, colIdx) => (
                <button
                  key={colIdx}
                  onClick={() => revealCell(rowIdx, colIdx)}
                  onContextMenu={(e) => toggleFlag(rowIdx, colIdx, e)}
                  className="w-8 h-8 text-xs font-bold border border-border flex items-center justify-center"
                  style={{
                    backgroundColor: cell.revealed
                      ? cell.mine
                        ? "oklch(0.65 0.25 29)"
                        : "oklch(0.35 0 0)"
                      : "oklch(0.25 0 0)",
                  }}
                >
                  {cell.flagged ? "🚩" : cell.revealed ? (cell.mine ? "💣" : cell.adjacent || "") : ""}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {!gameStarted && (
        <Button onClick={initBoard} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Left click to reveal, right click to flag mines</p>
    </div>
  );
}

// Flappy Bird Game Component
export function FlappyBirdGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    birdY: 200,
    birdVelocity: 0,
    pipes: [] as { x: number; gapY: number }[],
    score: 0,
    gameOver: false,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const gravity = 0.5;
    const jump = -8;
    const pipeWidth = 60;
    const pipeGap = 150;

    const draw = () => {
      ctx.fillStyle = "oklch(0.75 0.15 220)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bird
      ctx.fillStyle = "oklch(0.75 0.25 85)";
      ctx.fillRect(50, state.birdY, 30, 30);

      // Draw pipes
      ctx.fillStyle = "oklch(0.45 0.15 142)";
      state.pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
        ctx.fillRect(pipe.x, pipe.gapY + pipeGap, pipeWidth, canvas.height);
      });

      // Draw score
      ctx.fillStyle = "oklch(0.95 0 0)";
      ctx.font = "24px monospace";
      ctx.fillText(`Score: ${state.score}`, 10, 30);
    };

    const update = () => {
      state.birdVelocity += gravity;
      state.birdY += state.birdVelocity;

      // Check boundaries
      if (state.birdY <= 0 || state.birdY >= canvas.height - 30) {
        state.gameOver = true;
        setGameStarted(false);
        onGameOver(state.score);
        return;
      }

      // Update pipes
      state.pipes.forEach(pipe => {
        pipe.x -= 2;

        // Check collision
        if (pipe.x < 80 && pipe.x + pipeWidth > 50) {
          if (state.birdY < pipe.gapY || state.birdY + 30 > pipe.gapY + pipeGap) {
            state.gameOver = true;
            setGameStarted(false);
            onGameOver(state.score);
          }
        }

        // Score point
        if (pipe.x === 50) {
          state.score++;
          onScoreUpdate(state.score);
        }
      });

      // Remove off-screen pipes
      state.pipes = state.pipes.filter(pipe => pipe.x > -pipeWidth);

      // Add new pipes
      if (state.pipes.length === 0 || state.pipes[state.pipes.length - 1].x < canvas.width - 200) {
        state.pipes.push({
          x: canvas.width,
          gapY: Math.random() * (canvas.height - pipeGap - 100) + 50,
        });
      }
    };

    const handleClick = () => {
      state.birdVelocity = jump;
    };

    canvas.addEventListener("click", handleClick);

    const gameLoop = setInterval(() => {
      update();
      draw();
    }, 1000 / 60);

    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gameStarted]);

  const startGame = () => {
    gameStateRef.current = {
      birdY: 200,
      birdVelocity: 0,
      pipes: [],
      score: 0,
      gameOver: false,
    };
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={600} className="border-2 border-border rounded" />
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          {gameStateRef.current.gameOver ? "Play Again" : "Start Game"}
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Click to make the bird jump!</p>
    </div>
  );
}

// Breakout Game Component
export function BreakoutGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    paddleX: 175,
    ballX: 200,
    ballY: 300,
    ballDX: 3,
    ballDY: -3,
    bricks: [] as { x: number; y: number; alive: boolean }[],
    score: 0,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const paddleWidth = 100;
    const paddleHeight = 10;
    const ballRadius = 8;

    // Initialize bricks
    if (state.bricks.length === 0) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          state.bricks.push({
            x: col * 50 + 5,
            y: row * 20 + 30,
            alive: true,
          });
        }
      }
    }

    const draw = () => {
      ctx.fillStyle = "oklch(0.15 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw paddle
      ctx.fillStyle = "oklch(0.75 0.25 142)";
      ctx.fillRect(state.paddleX, canvas.height - 30, paddleWidth, paddleHeight);

      // Draw ball
      ctx.fillStyle = "oklch(0.85 0 0)";
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw bricks
      state.bricks.forEach((brick, index) => {
        if (brick.alive) {
          ctx.fillStyle = `oklch(${0.5 + (index % 5) * 0.1} 0.25 ${(index % 8) * 45})`;
          ctx.fillRect(brick.x, brick.y, 45, 15);
        }
      });
    };

    const update = () => {
      state.ballX += state.ballDX;
      state.ballY += state.ballDY;

      // Wall collision
      if (state.ballX <= ballRadius || state.ballX >= canvas.width - ballRadius) {
        state.ballDX = -state.ballDX;
      }
      if (state.ballY <= ballRadius) {
        state.ballDY = -state.ballDY;
      }

      // Paddle collision
      if (
        state.ballY >= canvas.height - 30 - ballRadius &&
        state.ballX >= state.paddleX &&
        state.ballX <= state.paddleX + paddleWidth
      ) {
        state.ballDY = -state.ballDY;
      }

      // Bottom collision (game over)
      if (state.ballY >= canvas.height) {
        setGameStarted(false);
        onGameOver(state.score);
        return;
      }

      // Brick collision
      state.bricks.forEach(brick => {
        if (
          brick.alive &&
          state.ballX >= brick.x &&
          state.ballX <= brick.x + 45 &&
          state.ballY >= brick.y &&
          state.ballY <= brick.y + 15
        ) {
          state.ballDY = -state.ballDY;
          brick.alive = false;
          state.score += 10;
          onScoreUpdate(state.score);
        }
      });

      // Win condition
      if (state.bricks.every(brick => !brick.alive)) {
        setGameStarted(false);
        onGameOver(state.score);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.paddleX = e.clientX - rect.left - paddleWidth / 2;
      state.paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, state.paddleX));
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const gameLoop = setInterval(() => {
      update();
      draw();
    }, 1000 / 60);

    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameStarted]);

  const startGame = () => {
    gameStateRef.current = {
      paddleX: 175,
      ballX: 200,
      ballY: 300,
      ballDX: 3,
      ballDY: -3,
      bricks: [],
      score: 0,
    };
    onScoreUpdate(0);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={500} className="border-2 border-border rounded" />
      {!gameStarted && (
        <Button onClick={startGame} size="lg">
          Start Game
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Move mouse to control paddle. Break all bricks!</p>
    </div>
  );
}
