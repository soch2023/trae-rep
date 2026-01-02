import { useEffect, useRef, useState, useCallback } from 'react';

type Evaluation = {
  cp: number; // centipawns
  mate: number | null; // moves to mate
  depth: number;
  bestMove: string;
};

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation>({ cp: 0, mate: null, depth: 0, bestMove: '' });

  useEffect(() => {
    // Initialize Stockfish from local path
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = typeof event.data === 'string' ? event.data : '';
      if (!message) return;
      
      if (message === 'readyok') {
        setIsReady(true);
      }

      if (message.startsWith('info') && message.includes('score')) {
        const cpMatch = message.match(/score cp (-?\d+)/);
        const mateMatch = message.match(/score mate (-?\d+)/);
        const depthMatch = message.match(/depth (\d+)/);
        const pvMatch = message.match(/ pv ([a-h1-8]{4})/);

        setEvaluation(prev => ({
          ...prev,
          cp: cpMatch ? parseInt(cpMatch[1]) : prev.cp,
          mate: mateMatch ? parseInt(mateMatch[1]) : null,
          depth: depthMatch ? parseInt(depthMatch[1]) : prev.depth,
          bestMove: pvMatch ? pvMatch[1] : prev.bestMove,
        }));
      }
      
      if (message.startsWith('bestmove')) {
        const bestMove = message.split(' ')[1];
        setEvaluation(prev => ({ ...prev, bestMove }));
      }
    };

    worker.postMessage('uci');

    return () => {
      worker.terminate();
    };
  }, []);

  const analyze = useCallback((fen: string, depth: number = 15) => {
    if (!workerRef.current || !isReady) return;
    
    workerRef.current.postMessage('stop');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth}`);
  }, [isReady]);

  const getBestMove = useCallback((fen: string, difficulty: number = 1): Promise<string> => {
    return new Promise((resolve) => {
      if (!workerRef.current) return resolve('');

      const depth = difficulty === 0 ? 5 : difficulty === 1 ? 10 : 18;
      const moveTime = difficulty === 0 ? 500 : difficulty === 1 ? 1000 : 2000;

      const handler = (event: MessageEvent) => {
        if (typeof event.data === 'string' && event.data.startsWith('bestmove')) {
          workerRef.current?.removeEventListener('message', handler);
          resolve(event.data.split(' ')[1]);
        }
      };

      workerRef.current.addEventListener('message', handler);
      
      workerRef.current.postMessage('stop');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go movetime ${moveTime} depth ${depth}`);
    });
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop');
  }, []);

  return { isReady, evaluation, analyze, getBestMove, stop, worker: workerRef.current };
}
