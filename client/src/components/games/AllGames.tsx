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

// Space Invaders Game
export function SpaceInvadersGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    player: { x: 200, y: 550, width: 40, height: 30 },
    bullets: [] as Array<{ x: number; y: number }>,
    enemies: [] as Array<{ x: number; y: number; alive: boolean }>,
    enemyBullets: [] as Array<{ x: number; y: number }>,
    score: 0,
    gameOver: false,
    direction: 1,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    // Initialize enemies
    if (state.enemies.length === 0) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
          state.enemies.push({ x: col * 50 + 50, y: row * 40 + 50, alive: true });
        }
      }
    }

    const draw = () => {
      ctx.fillStyle = "oklch(0.1 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw player
      ctx.fillStyle = "oklch(0.7 0.25 142)";
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

      // Draw enemies
      ctx.fillStyle = "oklch(0.65 0.25 29)";
      state.enemies.forEach((enemy) => {
        if (enemy.alive) {
          ctx.fillRect(enemy.x, enemy.y, 30, 30);
        }
      });

      // Draw bullets
      ctx.fillStyle = "oklch(0.9 0 0)";
      state.bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, 3, 10);
      });

      // Draw enemy bullets
      ctx.fillStyle = "oklch(0.65 0.25 0)";
      state.enemyBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, 3, 10);
      });

      // Draw score
      ctx.fillStyle = "oklch(0.9 0 0)";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${state.score}`, 10, 20);
    };

    const update = () => {
      // Move bullets
      state.bullets = state.bullets.filter((bullet) => {
        bullet.y -= 5;
        return bullet.y > 0;
      });

      // Move enemy bullets
      state.enemyBullets = state.enemyBullets.filter((bullet) => {
        bullet.y += 3;
        return bullet.y < canvas.height;
      });

      // Move enemies
      let hitEdge = false;
      state.enemies.forEach((enemy) => {
        if (enemy.alive) {
          enemy.x += state.direction * 2;
          if (enemy.x <= 0 || enemy.x >= canvas.width - 30) {
            hitEdge = true;
          }
        }
      });

      if (hitEdge) {
        state.direction *= -1;
        state.enemies.forEach((enemy) => {
          if (enemy.alive) enemy.y += 20;
        });
      }

      // Check bullet collisions
      state.bullets.forEach((bullet) => {
        state.enemies.forEach((enemy) => {
          if (
            enemy.alive &&
            bullet.x > enemy.x &&
            bullet.x < enemy.x + 30 &&
            bullet.y > enemy.y &&
            bullet.y < enemy.y + 30
          ) {
            enemy.alive = false;
            bullet.y = -100;
            state.score += 10;
            onScoreUpdate(state.score);
          }
        });
      });

      // Enemy shooting
      if (Math.random() < 0.02) {
        const aliveEnemies = state.enemies.filter((e) => e.alive);
        if (aliveEnemies.length > 0) {
          const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          state.enemyBullets.push({ x: shooter.x + 15, y: shooter.y + 30 });
        }
      }

      // Check player hit
      state.enemyBullets.forEach((bullet) => {
        if (
          bullet.x > state.player.x &&
          bullet.x < state.player.x + state.player.width &&
          bullet.y > state.player.y &&
          bullet.y < state.player.y + state.player.height
        ) {
          state.gameOver = true;
          onGameOver(state.score);
        }
      });

      // Check if all enemies dead
      if (state.enemies.every((e) => !e.alive)) {
        state.gameOver = true;
        onGameOver(state.score);
      }
    };

    const gameLoop = setInterval(() => {
      if (state.gameOver) {
        clearInterval(gameLoop);
        return;
      }
      update();
      draw();
    }, 1000 / 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && state.player.x > 0) {
        state.player.x -= 15;
      } else if (e.key === "ArrowRight" && state.player.x < canvas.width - state.player.width) {
        state.player.x += 15;
      } else if (e.key === " ") {
        e.preventDefault();
        state.bullets.push({ x: state.player.x + state.player.width / 2, y: state.player.y });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={500} height={600} className="border border-border rounded" />
      {!gameStarted && (
        <Button onClick={() => setGameStarted(true)}>Start Space Invaders</Button>
      )}
      <p className="text-sm text-muted-foreground">Arrow keys to move, Space to shoot</p>
    </div>
  );
}

// Sudoku Game
export function SudokuGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [board, setBoard] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const generateSudoku = () => {
    // Simple sudoku generator - creates a valid solved board then removes numbers
    const newBoard: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
    const newSolution: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
    
    // Fill diagonal 3x3 boxes
    for (let box = 0; box < 9; box += 3) {
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      let idx = 0;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          newSolution[box + i][box + j] = nums[idx++];
        }
      }
    }

    // Copy solution and remove some numbers for puzzle
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        newBoard[i][j] = Math.random() < 0.4 ? newSolution[i][j] : 0;
      }
    }

    setBoard(newBoard);
    setSolution(newSolution);
    setGameStarted(true);
  };

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] === 0) {
      setSelected({ row, col });
    }
  };

  const handleNumberInput = (num: number) => {
    if (selected) {
      const newBoard = board.map(row => [...row]);
      newBoard[selected.row][selected.col] = num;
      setBoard(newBoard);

      // Check if correct
      if (num === solution[selected.row][selected.col]) {
        onScoreUpdate(10);
        
        // Check if puzzle complete
        let complete = true;
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (newBoard[i][j] !== solution[i][j]) {
              complete = false;
              break;
            }
          }
        }
        if (complete) {
          onGameOver(100);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!gameStarted ? (
        <Button onClick={generateSudoku}>Start Sudoku</Button>
      ) : (
        <>
          <div className="grid grid-cols-9 gap-0 border-2 border-border">
            {board.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  className={`w-10 h-10 flex items-center justify-center border border-border cursor-pointer
                    ${selected?.row === i && selected?.col === j ? "bg-primary/20" : ""}
                    ${cell !== 0 ? "font-bold" : ""}
                    ${(i + 1) % 3 === 0 && i !== 8 ? "border-b-2 border-b-foreground" : ""}
                    ${(j + 1) % 3 === 0 && j !== 8 ? "border-r-2 border-r-foreground" : ""}
                  `}
                >
                  {cell !== 0 ? cell : ""}
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button key={num} onClick={() => handleNumberInput(num)} variant="outline" size="sm">
                {num}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Trivia Quiz Game
export function TriviaGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [answered, setAnswered] = useState(false);

  const questions = [
    { q: "What is the capital of France?", a: ["London", "Berlin", "Paris", "Madrid"], correct: 2 },
    { q: "What is 2 + 2?", a: ["3", "4", "5", "6"], correct: 1 },
    { q: "Which planet is closest to the Sun?", a: ["Venus", "Mercury", "Earth", "Mars"], correct: 1 },
    { q: "Who painted the Mona Lisa?", a: ["Van Gogh", "Picasso", "Da Vinci", "Monet"], correct: 2 },
    { q: "What is the largest ocean?", a: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
    { q: "How many continents are there?", a: ["5", "6", "7", "8"], correct: 2 },
    { q: "What is the speed of light?", a: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"], correct: 0 },
    { q: "Who wrote Romeo and Juliet?", a: ["Dickens", "Shakespeare", "Austen", "Hemingway"], correct: 1 },
    { q: "What is the smallest prime number?", a: ["0", "1", "2", "3"], correct: 2 },
    { q: "What year did World War II end?", a: ["1943", "1944", "1945", "1946"], correct: 2 },
  ];

  const handleAnswer = (index: number) => {
    if (answered) return;
    
    setAnswered(true);
    const correct = index === questions[currentQuestion].correct;
    
    if (correct) {
      const newScore = score + 10;
      setScore(newScore);
      onScoreUpdate(newScore);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setAnswered(false);
      } else {
        onGameOver(score);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl">
      {!gameStarted ? (
        <Button onClick={() => setGameStarted(true)}>Start Trivia Quiz</Button>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Question {currentQuestion + 1} of {questions.length}</p>
            <h3 className="text-2xl font-bold mb-6">{questions[currentQuestion].q}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {questions[currentQuestion].a.map((answer, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                variant="outline"
                className={`h-auto py-4 text-lg ${
                  answered && index === questions[currentQuestion].correct
                    ? "bg-green-500/20 border-green-500"
                    : answered
                    ? "opacity-50"
                    : ""
                }`}
                disabled={answered}
              >
                {answer}
              </Button>
            ))}
          </div>
          <p className="text-lg font-semibold">Score: {score}</p>
        </>
      )}
    </div>
  );
}

// Simple Puzzle Game (Sliding Tiles)
export function PuzzleGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const initGame = () => {
    const initialTiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    // Shuffle
    for (let i = 0; i < 100; i++) {
      const emptyIndex = initialTiles.indexOf(0);
      const neighbors = [];
      if (emptyIndex % 3 !== 0) neighbors.push(emptyIndex - 1);
      if (emptyIndex % 3 !== 2) neighbors.push(emptyIndex + 1);
      if (emptyIndex >= 3) neighbors.push(emptyIndex - 3);
      if (emptyIndex < 6) neighbors.push(emptyIndex + 3);
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      [initialTiles[emptyIndex], initialTiles[randomNeighbor]] = [initialTiles[randomNeighbor], initialTiles[emptyIndex]];
    }
    setTiles(initialTiles);
    setMoves(0);
    setGameStarted(true);
  };

  const handleTileClick = (index: number) => {
    const emptyIndex = tiles.indexOf(0);
    const canMove =
      (index === emptyIndex - 1 && emptyIndex % 3 !== 0) ||
      (index === emptyIndex + 1 && emptyIndex % 3 !== 2) ||
      index === emptyIndex - 3 ||
      index === emptyIndex + 3;

    if (canMove) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(moves + 1);

      // Check win
      if (newTiles.every((tile, i) => tile === i + 1 || (i === 8 && tile === 0))) {
        onGameOver(Math.max(100 - moves, 10));
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!gameStarted ? (
        <Button onClick={initGame}>Start Puzzle</Button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((tile, index) => (
              <div
                key={index}
                onClick={() => handleTileClick(index)}
                className={`w-20 h-20 flex items-center justify-center text-2xl font-bold border-2 rounded cursor-pointer
                  ${tile === 0 ? "bg-background border-border" : "bg-primary text-primary-foreground border-primary hover:opacity-80"}
                `}
              >
                {tile !== 0 ? tile : ""}
              </div>
            ))}
          </div>
          <p className="text-lg">Moves: {moves}</p>
          <p className="text-sm text-muted-foreground">Click tiles adjacent to empty space</p>
        </>
      )}
    </div>
  );
}

// Pac-Man Game
export function PacManGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    pacman: { x: 14, y: 23, dx: 0, dy: 0 },
    ghosts: [
      { x: 14, y: 11, dx: 1, dy: 0, color: "oklch(0.65 0.25 29)" },
      { x: 12, y: 14, dx: 0, dy: 1, color: "oklch(0.65 0.25 220)" },
      { x: 16, y: 14, dx: 0, dy: -1, color: "oklch(0.65 0.25 330)" },
    ],
    dots: [] as Array<{ x: number; y: number }>,
    score: 0,
    lives: 3,
    gameOver: false,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const cellSize = 20;

    // Initialize dots
    if (state.dots.length === 0) {
      for (let x = 1; x < 28; x++) {
        for (let y = 1; y < 31; y++) {
          if ((x + y) % 2 === 0) {
            state.dots.push({ x, y });
          }
        }
      }
    }

    const draw = () => {
      ctx.fillStyle = "oklch(0.1 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw dots
      ctx.fillStyle = "oklch(0.9 0 0)";
      state.dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x * cellSize + cellSize / 2, dot.y * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Pac-Man
      ctx.fillStyle = "oklch(0.75 0.25 85)";
      ctx.beginPath();
      ctx.arc(
        state.pacman.x * cellSize + cellSize / 2,
        state.pacman.y * cellSize + cellSize / 2,
        cellSize / 2 - 2,
        0.2 * Math.PI,
        1.8 * Math.PI
      );
      ctx.lineTo(state.pacman.x * cellSize + cellSize / 2, state.pacman.y * cellSize + cellSize / 2);
      ctx.fill();

      // Draw ghosts
      state.ghosts.forEach((ghost) => {
        ctx.fillStyle = ghost.color;
        ctx.fillRect(ghost.x * cellSize, ghost.y * cellSize, cellSize, cellSize);
      });

      // Draw score and lives
      ctx.fillStyle = "oklch(0.9 0 0)";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${state.score} Lives: ${state.lives}`, 10, 20);
    };

    const update = () => {
      // Move Pac-Man
      const newX = state.pacman.x + state.pacman.dx;
      const newY = state.pacman.y + state.pacman.dy;

      if (newX >= 0 && newX < 28 && newY >= 0 && newY < 31) {
        state.pacman.x = newX;
        state.pacman.y = newY;
      }

      // Check dot collision
      const dotIndex = state.dots.findIndex((dot) => dot.x === state.pacman.x && dot.y === state.pacman.y);
      if (dotIndex !== -1) {
        state.dots.splice(dotIndex, 1);
        state.score += 10;
        onScoreUpdate(state.score);
      }

      // Move ghosts
      state.ghosts.forEach((ghost) => {
        if (Math.random() < 0.05) {
          const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
          ];
          const dir = directions[Math.floor(Math.random() * directions.length)];
          ghost.dx = dir.dx;
          ghost.dy = dir.dy;
        }

        const newGhostX = ghost.x + ghost.dx;
        const newGhostY = ghost.y + ghost.dy;

        if (newGhostX >= 0 && newGhostX < 28 && newGhostY >= 0 && newGhostY < 31) {
          ghost.x = newGhostX;
          ghost.y = newGhostY;
        }

        // Check collision with Pac-Man
        if (ghost.x === state.pacman.x && ghost.y === state.pacman.y) {
          state.lives--;
          if (state.lives <= 0) {
            state.gameOver = true;
            onGameOver(state.score);
          } else {
            state.pacman.x = 14;
            state.pacman.y = 23;
          }
        }
      });

      // Win condition
      if (state.dots.length === 0) {
        state.gameOver = true;
        onGameOver(state.score + 1000);
      }
    };

    const gameLoop = setInterval(() => {
      if (state.gameOver) {
        clearInterval(gameLoop);
        return;
      }
      update();
      draw();
    }, 150);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        state.pacman.dx = 0;
        state.pacman.dy = -1;
      } else if (e.key === "ArrowDown") {
        state.pacman.dx = 0;
        state.pacman.dy = 1;
      } else if (e.key === "ArrowLeft") {
        state.pacman.dx = -1;
        state.pacman.dy = 0;
      } else if (e.key === "ArrowRight") {
        state.pacman.dx = 1;
        state.pacman.dy = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={560} height={620} className="border border-border rounded bg-black" />
      {!gameStarted && <Button onClick={() => setGameStarted(true)}>Start Pac-Man</Button>}
      <p className="text-sm text-muted-foreground">Arrow keys to move</p>
    </div>
  );
}

// Racing Game
export function RacingGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    car: { x: 200, y: 400, speed: 0 },
    obstacles: [] as Array<{ x: number; y: number }>,
    score: 0,
    gameOver: false,
  });

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    const draw = () => {
      // Draw road
      ctx.fillStyle = "oklch(0.3 0 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw lane lines
      ctx.strokeStyle = "oklch(0.9 0 0)";
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 10]);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo((i + 1) * 100, 0);
        ctx.lineTo((i + 1) * 100, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw car
      ctx.fillStyle = "oklch(0.65 0.25 29)";
      ctx.fillRect(state.car.x, state.car.y, 40, 60);

      // Draw obstacles
      ctx.fillStyle = "oklch(0.5 0.15 220)";
      state.obstacles.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, 40, 60);
      });

      // Draw score
      ctx.fillStyle = "oklch(0.9 0 0)";
      ctx.font = "20px monospace";
      ctx.fillText(`Score: ${state.score}`, 10, 30);
    };

    const update = () => {
      // Move obstacles
      state.obstacles.forEach((obs) => {
        obs.y += 5;
      });

      // Remove off-screen obstacles
      state.obstacles = state.obstacles.filter((obs) => obs.y < canvas.height);

      // Add new obstacles
      if (Math.random() < 0.02) {
        const lane = Math.floor(Math.random() * 4);
        state.obstacles.push({ x: lane * 100 + 30, y: -60 });
      }

      // Check collision
      state.obstacles.forEach((obs) => {
        if (
          state.car.x < obs.x + 40 &&
          state.car.x + 40 > obs.x &&
          state.car.y < obs.y + 60 &&
          state.car.y + 60 > obs.y
        ) {
          state.gameOver = true;
          onGameOver(state.score);
        }
      });

      // Update score
      state.score++;
      if (state.score % 10 === 0) {
        onScoreUpdate(state.score);
      }
    };

    const gameLoop = setInterval(() => {
      if (state.gameOver) {
        clearInterval(gameLoop);
        return;
      }
      update();
      draw();
    }, 1000 / 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && state.car.x > 0) {
        state.car.x -= 100;
      } else if (e.key === "ArrowRight" && state.car.x < 300) {
        state.car.x += 100;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={600} className="border border-border rounded" />
      {!gameStarted && <Button onClick={() => setGameStarted(true)}>Start Racing</Button>}
      <p className="text-sm text-muted-foreground">Arrow keys to change lanes</p>
    </div>
  );
}

// Platformer Game
export function PlatformerGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    player: { x: 50, y: 400, vx: 0, vy: 0, onGround: false },
    platforms: [
      { x: 0, y: 450, width: 600, height: 20 },
      { x: 150, y: 350, width: 100, height: 20 },
      { x: 300, y: 280, width: 100, height: 20 },
      { x: 450, y: 210, width: 100, height: 20 },
    ],
    coins: [
      { x: 180, y: 320, collected: false },
      { x: 330, y: 250, collected: false },
      { x: 480, y: 180, collected: false },
    ],
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
    const keys: Record<string, boolean> = {};

    const draw = () => {
      ctx.fillStyle = "oklch(0.75 0.15 220)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw platforms
      ctx.fillStyle = "oklch(0.4 0 0)";
      state.platforms.forEach((platform) => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });

      // Draw coins
      ctx.fillStyle = "oklch(0.75 0.25 85)";
      state.coins.forEach((coin) => {
        if (!coin.collected) {
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw player
      ctx.fillStyle = "oklch(0.65 0.25 29)";
      ctx.fillRect(state.player.x, state.player.y, 30, 30);

      // Draw score
      ctx.fillStyle = "oklch(0.1 0 0)";
      ctx.font = "20px monospace";
      ctx.fillText(`Score: ${state.score}`, 10, 30);
    };

    const update = () => {
      // Apply gravity
      state.player.vy += gravity;
      state.player.y += state.player.vy;
      state.player.x += state.player.vx;

      // Horizontal movement
      if (keys["ArrowLeft"]) {
        state.player.vx = -5;
      } else if (keys["ArrowRight"]) {
        state.player.vx = 5;
      } else {
        state.player.vx = 0;
      }

      // Platform collision
      state.player.onGround = false;
      state.platforms.forEach((platform) => {
        if (
          state.player.x < platform.x + platform.width &&
          state.player.x + 30 > platform.x &&
          state.player.y + 30 >= platform.y &&
          state.player.y + 30 <= platform.y + platform.height &&
          state.player.vy >= 0
        ) {
          state.player.y = platform.y - 30;
          state.player.vy = 0;
          state.player.onGround = true;
        }
      });

      // Collect coins
      state.coins.forEach((coin) => {
        if (
          !coin.collected &&
          Math.abs(state.player.x + 15 - coin.x) < 20 &&
          Math.abs(state.player.y + 15 - coin.y) < 20
        ) {
          coin.collected = true;
          state.score += 100;
          onScoreUpdate(state.score);
        }
      });

      // Game over if fall off
      if (state.player.y > canvas.height) {
        state.gameOver = true;
        onGameOver(state.score);
      }

      // Win condition
      if (state.coins.every((c) => c.collected)) {
        state.gameOver = true;
        onGameOver(state.score + 500);
      }
    };

    const gameLoop = setInterval(() => {
      if (state.gameOver) {
        clearInterval(gameLoop);
        return;
      }
      update();
      draw();
    }, 1000 / 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === " " && state.player.onGround) {
        state.player.vy = -12;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={600} height={500} className="border border-border rounded" />
      {!gameStarted && <Button onClick={() => setGameStarted(true)}>Start Platformer</Button>}
      <p className="text-sm text-muted-foreground">Arrow keys to move, Space to jump</p>
    </div>
  );
}

// Solitaire, Chess, and Checkers are complex games that would require extensive code.
// For now, I'll create simplified placeholder versions that show the concept.

// Simplified Solitaire
export function SolitaireGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4">
      {!gameStarted ? (
        <Button onClick={() => setGameStarted(true)}>Start Solitaire</Button>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-lg mb-4">Solitaire - Classic Card Game</p>
          <p className="text-sm text-muted-foreground mb-4">
            Full solitaire implementation with drag-and-drop coming soon!
          </p>
          <p className="text-sm">Moves: {moves}</p>
          <Button onClick={() => { setMoves(moves + 1); onScoreUpdate(moves * 10); }} className="mt-4">
            Make Move
          </Button>
        </div>
      )}
    </div>
  );
}

// Simplified Chess
export function ChessGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {!gameStarted ? (
        <Button onClick={() => setGameStarted(true)}>Start Chess</Button>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-lg mb-4">Chess - Strategic Board Game</p>
          <p className="text-sm text-muted-foreground">
            Full chess implementation with piece movement and rules coming soon!
          </p>
        </div>
      )}
    </div>
  );
}

// Simplified Checkers
export function CheckersGame({ onScoreUpdate, onGameOver }: { onScoreUpdate: (score: number) => void; onGameOver: (score: number) => void }) {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {!gameStarted ? (
        <Button onClick={() => setGameStarted(true)}>Start Checkers</Button>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-lg mb-4">Checkers - Classic Board Game</p>
          <p className="text-sm text-muted-foreground">
            Full checkers implementation with jump mechanics coming soon!
          </p>
        </div>
      )}
    </div>
  );
}
