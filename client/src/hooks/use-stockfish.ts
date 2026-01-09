import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

type Evaluation = {
  cp: number; // centipawns
  mate: number | null; // moves to mate
  depth: number;
  bestMove: string;
  nodes: number;
  nps: number;
};

type StockfishStatus = 'initializing' | 'ready' | 'error' | 'stopped';

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const [status, setStatus] = useState<StockfishStatus>('initializing');
  const [evaluation, setEvaluation] = useState<Evaluation>({ 
    cp: 0, 
    mate: null, 
    depth: 0, 
    bestMove: '',
    nodes: 0,
    nps: 0
  });
  const [error, setError] = useState<string | null>(null);

  // 配置参数
  const difficultyConfig = useMemo(() => [
    { depth: 2, time: 100, elo: 800, label: '新手' },
    { depth: 4, time: 200, elo: 1200, label: '入门' },
    { depth: 8, time: 500, elo: 1600, label: '业余' },
    { depth: 12, time: 1000, elo: 2000, label: '专业' },
    { depth: 18, time: 2000, elo: 2400, label: '大师' },
    { depth: 24, time: 4000, elo: 2800, label: '宗师' }
  ], []);

  // 初始化Stockfish
  useEffect(() => {
    try {
      const worker = new Worker('/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const message = typeof event.data === 'string' ? event.data : '';
        if (!message) return;
        
        // 只在开发模式下打印消息
        if (process.env.NODE_ENV === 'development') {
          console.log('Stockfish:', message);
        }

        if (message === 'readyok') {
          setStatus('ready');
          setError(null);
          // 处理队列中的消息
          processMessageQueue();
        }

        if (message.startsWith('info') && message.includes('score')) {
          const cpMatch = message.match(/score cp (-?\d+)/);
          const mateMatch = message.match(/score mate (-?\d+)/);
          const depthMatch = message.match(/depth (\d+)/);
          const pvMatch = message.match(/ pv ([a-h1-8]{4})/);
          const nodesMatch = message.match(/nodes (\d+)/);
          const npsMatch = message.match(/nps (\d+)/);

          setEvaluation(prev => ({
            ...prev,
            cp: cpMatch ? parseInt(cpMatch[1]) : prev.cp,
            mate: mateMatch ? parseInt(mateMatch[1]) : null,
            depth: depthMatch ? parseInt(depthMatch[1]) : prev.depth,
            bestMove: pvMatch ? pvMatch[1] : prev.bestMove,
            nodes: nodesMatch ? parseInt(nodesMatch[1]) : prev.nodes,
            nps: npsMatch ? parseInt(npsMatch[1]) : prev.nps
          }));
        }
        
        if (message.startsWith('bestmove')) {
          const bestMove = message.split(' ')[1];
          setEvaluation(prev => ({ ...prev, bestMove }));
        }

        if (message.startsWith('error')) {
          setError(message);
          setStatus('error');
        }
      };

      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        setError(`Worker error: ${error.message}`);
        setStatus('error');
      };

      worker.postMessage('uci');

      return () => {
        worker.terminate();
        setStatus('stopped');
      };
    } catch (err) {
      console.error('Failed to initialize Stockfish:', err);
      setError(`Initialization error: ${(err as Error).message}`);
      setStatus('error');
      return undefined;
    }
  }, []);

  // 处理消息队列
  const processMessageQueue = useCallback(() => {
    if (status !== 'ready' || !workerRef.current || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    while (messageQueueRef.current.length > 0 && status === 'ready') {
      const message = messageQueueRef.current.shift();
      if (message) {
        workerRef.current?.postMessage(message);
      }
    }
    isProcessingRef.current = false;
  }, [status]);

  // 发送消息到Stockfish
  const sendMessage = useCallback((message: string) => {
    if (status === 'ready' && workerRef.current) {
      workerRef.current.postMessage(message);
    } else {
      messageQueueRef.current.push(message);
    }
  }, [status]);

  // 分析局面
  const analyze = useCallback((fen: string, depth: number = 15) => {
    if (status !== 'ready') return;
    
    sendMessage('stop');
    sendMessage(`position fen ${fen}`);
    sendMessage(`go depth ${depth}`);
  }, [status, sendMessage]);

  // 获取最佳走法
  const getBestMove = useCallback((fen: string, difficulty: number = 1): Promise<string> => {
    return new Promise((resolve) => {
      if (status !== 'ready' || !workerRef.current) {
        resolve('');
        return;
      }

      const config = difficultyConfig[Math.min(difficulty, difficultyConfig.length - 1)];
      const { depth, time } = config;

      const handler = (event: MessageEvent) => {
        if (typeof event.data === 'string' && event.data.startsWith('bestmove')) {
          workerRef.current?.removeEventListener('message', handler);
          const bestMove = event.data.split(' ')[1];
          resolve(bestMove || '');
        }
      };

      workerRef.current.addEventListener('message', handler);
      
      sendMessage('stop');
      sendMessage(`position fen ${fen}`);
      sendMessage(`go movetime ${time} depth ${depth}`);
    });
  }, [status, sendMessage, difficultyConfig]);

  // 停止计算
  const stop = useCallback(() => {
    sendMessage('stop');
  }, [sendMessage]);

  // 重置引擎
  const reset = useCallback(() => {
    sendMessage('ucinewgame');
    sendMessage('isready');
  }, [sendMessage]);

  return { 
    isReady: status === 'ready',
    status,
    evaluation,
    error,
    analyze, 
    getBestMove, 
    stop, 
    reset,
    difficultyConfig
  };
}
