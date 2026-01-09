import { useState, useCallback, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useStockfish } from './use-stockfish';
import { useSettings } from './use-settings';

const STORAGE_KEY = 'chess_game_state';
const AUTO_SAVE_INTERVAL = 30000; // 30秒自动保存

export type GameState = {
  board: Chess;
  fen: string;
  moveHistory: string[];
  isGameOver: boolean;
  gameResult: {
    status: 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'insufficient material' | 'threefold repetition' | 'fivefold repetition' | 'fifty move rule' | 'seventy five move rule';
    winner?: 'w' | 'b' | 'draw';
  };
};

export type GameError = {
  type: 'stockfish' | 'chessjs' | 'network' | 'unknown';
  message: string;
  timestamp: number;
};

export function useChessGame() {
  // 游戏状态
  const [board, setBoard] = useState(new Chess());
  const [fen, setFen] = useState(board.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [errors, setErrors] = useState<GameError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 依赖
  const { settings, updateSettings } = useSettings();
  const { isReady, evaluation, analyze, getBestMove, stop, reset: resetStockfish, error: stockfishError } = useStockfish();
  
  // AI对战状态
  const [aiVsAiActive, setAiVsAiActive] = useState(false);
  
  // 监听Stockfish错误
  useEffect(() => {
    if (stockfishError) {
      addError({
        type: 'stockfish',
        message: stockfishError,
        timestamp: Date.now()
      });
    }
  }, [stockfishError]);
  
  // 游戏结果
  const gameResult = useMemo(() => {
    if (!board.isGameOver()) {
      return { status: 'in_progress' as const };
    }
    
    if (board.isCheckmate()) {
      return { 
        status: 'checkmate' as const, 
        winner: board.turn() === 'w' ? 'b' : 'w' 
      };
    }
    
    if (board.isStalemate()) {
      return { status: 'stalemate' as const, winner: 'draw' };
    }
    
    if (board.isDraw()) {
      if (board.isThreefoldRepetition()) {
        return { status: 'threefold repetition' as const, winner: 'draw' };
      }
      if (board.isInsufficientMaterial()) {
        return { status: 'insufficient material' as const, winner: 'draw' };
      }
      // 检查50步规则
      const moves = board.history();
      if (moves.length >= 50) {
        return { status: 'fifty move rule' as const, winner: 'draw' };
      }
      return { status: 'draw' as const, winner: 'draw' };
    }
    
    return { status: 'in_progress' as const };
  }, [board]);

  // 添加错误
  const addError = useCallback((error: GameError) => {
    setErrors(prev => [...prev.slice(-4), error]); // 只保留最近5个错误
  }, []);

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 分析局面
  useEffect(() => {
    analyze(fen);
  }, [fen, analyze]);

  // 处理游戏结束
  useEffect(() => {
    if (board.isGameOver()) {
      setAiVsAiActive(false);
      stop();
    }
  }, [board, stop]);

  // 检查是否是玩家回合
  const isPlayerTurn = useMemo(() => {
    if (settings.gameMode !== 'vsAI') return false;
    return board.turn() === settings.playerColor;
  }, [settings.gameMode, settings.playerColor, board]);

  // AI走棋逻辑
  useEffect(() => {
    // AI vs AI模式
    if (settings.gameMode === 'aiVsAi' && aiVsAiActive && !board.isGameOver()) {
      const makeAiMove = async () => {
        await new Promise(r => setTimeout(r, 500));
        // 确保模式和活动状态未改变
        if (!aiVsAiActive || settings.gameMode !== 'aiVsAi' || board.isGameOver()) return; 
        
        const currentTurn = board.turn();
        const difficulty = currentTurn === 'w' 
          ? (settings.whiteAIDifficulty ?? 1) 
          : (settings.blackAIDifficulty ?? 2);
        
        const bestMove = await getBestMove(board.fen(), difficulty);
        if (bestMove && settings.gameMode === 'aiVsAi' && aiVsAiActive) {
          safeMove(bestMove);
        }
      };
      makeAiMove();
    } 
    // 玩家vs AI模式
    else if (settings.gameMode === 'vsAI' && !board.isGameOver() && !isPlayerTurn) {
      const makeAiMove = async () => {
        await new Promise(r => setTimeout(r, 600)); // 稍长一点的延迟，给悔棋留足制动时间
        
        // 关键防护：确保现在依然是AI回合，且模式没变
        if (settings.gameMode !== 'vsAI' || board.turn() === settings.playerColor || board.isGameOver()) return;
        
        const bestMove = await getBestMove(board.fen(), settings.aiDifficulty);
        
        // 再次检查局面，防止计算期间发生了悔棋
        if (bestMove && settings.gameMode === 'vsAI' && board.turn() !== settings.playerColor) {
          safeMove(bestMove);
        }
      };
      makeAiMove();
    }
  }, [board, fen, settings.gameMode, settings.aiDifficulty, settings.whiteAIDifficulty, settings.blackAIDifficulty, settings.playerColor, aiVsAiActive, isPlayerTurn, getBestMove]);

  // 安全走棋
  const safeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    try {
      setBoard(prev => {
        // 防止对局已结束或状态异常时继续走棋
        if (prev.isGameOver()) return prev;

        const next = new Chess(prev.fen());
        let moveResult;
        
        try {
          if (typeof move === 'string' && move.length >= 4) {
            const from = move.slice(0, 2);
            const to = move.slice(2, 4);
            const promotion = move.length === 5 ? move[4] : 'q';
            moveResult = next.move({ from, to, promotion });
          } else {
            moveResult = next.move(move);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Invalid move';
          addError({
            type: 'chessjs',
            message: `走棋失败: ${errorMessage}`,
            timestamp: Date.now()
          });
          return prev;
        }

        if (moveResult) {
          const newFen = next.fen();
          // 使用 setTimeout 确保 FEN 更新在下一帧触发，避免渲染竞争
          setTimeout(() => setFen(newFen), 0);
          setMoveHistory(h => [...h, moveResult.san]);
          return next;
        }
        return prev;
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      addError({
        type: 'unknown',
        message: `走棋出错: ${errorMessage}`,
        timestamp: Date.now()
      });
    }
  }, [addError]);

  // 处理落子
  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    if (aiVsAiActive) return false;
    if (settings.gameMode === 'vsAI' && board.turn() !== settings.playerColor) return false;

    try {
      const move = { from: sourceSquare, to: targetSquare, promotion: "q" };
      const next = new Chess(board.fen());
      const result = next.move(move);

      if (result) {
        setBoard(next);
        setFen(next.fen());
        setMoveHistory(h => [...h, result.san]);
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid move';
      addError({
        type: 'chessjs',
        message: `落子失败: ${errorMessage}`,
        timestamp: Date.now()
      });
      return false;
    }
    return false;
  }, [board, settings.gameMode, settings.playerColor, aiVsAiActive, addError]);

  // 重置游戏
  const resetGame = useCallback(() => {
    try {
      setIsLoading(true);
      stop();
      resetStockfish();
      const newGame = new Chess();
      setBoard(newGame);
      setFen(newGame.fen());
      setMoveHistory([]);
      setAiVsAiActive(false);
      clearErrors();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addError({
        type: 'unknown',
        message: `重置游戏失败: ${errorMessage}`,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  }, [stop, resetStockfish, addError, clearErrors]);

  // 悔棋
  const undoMove = useCallback(() => {
    try {
      stop();
      
      if (moveHistory.length === 0) return;
      
      const history = [...moveHistory];
      history.pop(); // 移除最后一步
      
      // 创建新游戏并从标准起始位开始推演
      const newGame = new Chess();
      let success = true;
      
      for (const m of history) {
        try {
          const result = newGame.move(m);
          if (!result) {
            throw new Error(`Invalid move in history: ${m}`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Reconstruction error';
          addError({
            type: 'chessjs',
            message: `历史记录推演失败: ${errorMessage}`,
            timestamp: Date.now()
          });
          success = false;
          break;
        }
      }
      
      if (success) {
        const newFen = newGame.fen();
        // 先更新基础状态
        setMoveHistory(history);
        setFen(newFen);
        setBoard(newGame);
      } else {
        // 如果历史记录推演失败，作为保底方案：使用 chess.js 自带的 undo
        // 虽然可能不如历史推演精准，但能防止崩溃
        try {
          const rollbackGame = new Chess(board.fen());
          rollbackGame.undo();
          const rollbackFen = rollbackGame.fen();
          setBoard(rollbackGame);
          setFen(rollbackFen);
          setMoveHistory(h => h.slice(0, -1));
        } catch (rollbackErr) {
          const errorMessage = rollbackErr instanceof Error ? rollbackErr.message : 'Rollback error';
          addError({
            type: 'chessjs',
            message: `悔棋失败: ${errorMessage}`,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addError({
        type: 'unknown',
        message: `悔棋出错: ${errorMessage}`,
        timestamp: Date.now()
      });
    }
  }, [board, moveHistory, stop, addError]);

  // 翻转棋盘
  const toggleBoardOrientation = useCallback(() => {
    updateSettings({
      ...settings,
      boardOrientation: settings.boardOrientation === 'white' ? 'black' : 'white'
    });
  }, [settings, updateSettings]);

  // 切换玩家颜色
  const togglePlayerColor = useCallback(() => {
    updateSettings({ 
      ...settings, 
      playerColor: settings.playerColor === 'w' ? 'b' : 'w' 
    });
  }, [settings, updateSettings]);

  // 切换游戏模式
  const setGameMode = useCallback((mode: 'local' | 'vsAI' | 'aiVsAi') => {
    updateSettings({ 
      ...settings, 
      gameMode: mode 
    });
  }, [settings, updateSettings]);

  // 导出游戏为PGN
  const exportPGN = useCallback(() => {
    return board.pgn({ maxWidth: 70, newline: '\n' });
  }, [board]);

  // 保存游戏状态到本地存储
  const saveGame = useCallback(() => {
    try {
      const gameData = {
        fen: fen,
        moveHistory: moveHistory,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      addError({
        type: 'unknown',
        message: `保存游戏失败: ${errorMessage}`,
        timestamp: Date.now()
      });
      return false;
    }
  }, [fen, moveHistory, addError]);

  // 从本地存储加载游戏状态
  const loadGame = useCallback(() => {
    try {
      setIsLoading(true);
      const savedData = localStorage.getItem(STORAGE_KEY);
      
      if (!savedData) {
        throw new Error('No saved game found');
      }
      
      const gameData = JSON.parse(savedData);
      const newGame = new Chess(gameData.fen);
      
      setBoard(newGame);
      setFen(gameData.fen);
      setMoveHistory(gameData.moveHistory);
      stop();
      clearErrors();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';
      addError({
        type: 'unknown',
        message: `加载游戏失败: ${errorMessage}`,
        timestamp: Date.now()
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [stop, addError, clearErrors]);

  // 清除保存的游戏状态
  const clearSavedGame = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Clear failed';
      addError({
        type: 'unknown',
        message: `清除保存失败: ${errorMessage}`,
        timestamp: Date.now()
      });
      return false;
    }
  }, [addError]);

  // 导入PGN游戏
  const importPGN = useCallback((pgn: string) => {
    try {
      setIsLoading(true);
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      
      // 检查是否成功加载（通过检查是否有走法历史）
      const basicMoves = newGame.history();
      if (basicMoves.length === 0) {
        throw new Error('Invalid PGN format');
      }
      
      const moves = newGame.history({ verbose: true }).map(move => move.san);
      
      setBoard(newGame);
      setFen(newGame.fen());
      setMoveHistory(moves);
      stop();
      clearErrors();
      saveGame(); // 导入后自动保存
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      addError({
        type: 'chessjs',
        message: `导入PGN失败: ${errorMessage}`,
        timestamp: Date.now()
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [stop, addError, clearErrors, saveGame]);

  // 自动保存
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!board.isGameOver()) {
        saveGame();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [board, saveGame]);

  // 初始化时尝试加载保存的游戏
  useEffect(() => {
    // 只在首次加载时尝试加载，避免重复加载
    const hasLoaded = sessionStorage.getItem('chess_game_loaded');
    if (!hasLoaded) {
      loadGame();
      sessionStorage.setItem('chess_game_loaded', 'true');
    }
  }, [loadGame]);

  // 游戏状态
  const gameState = useMemo<GameState>(() => ({
    board,
    fen,
    moveHistory,
    isGameOver: board.isGameOver(),
    gameResult: {
      ...gameResult,
      winner: gameResult.winner as 'w' | 'b' | 'draw' | undefined
    }
  }), [board, fen, moveHistory, gameResult]);

  return {
    // 状态
    gameState,
    isReady,
    evaluation,
    aiVsAiActive,
    isPlayerTurn,
    errors,
    isLoading,
    
    // 操作
    safeMove,
    onDrop,
    resetGame,
    undoMove,
    toggleBoardOrientation,
    togglePlayerColor,
    setGameMode,
    setAiVsAiActive,
    exportPGN,
    importPGN,
    clearErrors,
    
    // 保存/加载
    saveGame,
    loadGame,
    clearSavedGame,
    
    // 辅助
    stop
  };
}
