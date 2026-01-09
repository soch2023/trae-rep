import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle, MinusCircle, RotateCcw, Share2 } from 'lucide-react';
import { useChessGame } from '@/hooks/use-chess-game';

type GameResultModalProps = {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
};

export function GameResultModal({ open, onClose, onRestart }: GameResultModalProps) {
  const { gameState } = useChessGame();
  const [resultText, setResultText] = useState('');
  const [resultIcon, setResultIcon] = useState<React.ReactNode>(null);
  const [resultColor, setResultColor] = useState('');

  useEffect(() => {
    if (gameState.isGameOver) {
      const { gameResult } = gameState;
      
      switch (gameResult.status) {
        case 'checkmate':
          if (gameResult.winner === 'w') {
            setResultText('白方胜利！');
            setResultIcon(<Trophy className="w-8 h-8" />);
            setResultColor('text-yellow-500');
          } else {
            setResultText('黑方胜利！');
            setResultIcon(<Trophy className="w-8 h-8" />);
            setResultColor('text-yellow-500');
          }
          break;
        case 'stalemate':
          setResultText('和棋 - 僵局');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        case 'draw':
          setResultText('和棋');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        case 'insufficient material':
          setResultText('和棋 - 子力不足');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        case 'threefold repetition':
          setResultText('和棋 - 三次重复局面');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        case 'fivefold repetition':
          setResultText('和棋 - 五次重复局面');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        case 'fifty move rule':
          setResultText('和棋 - 五十回合规则');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        case 'seventy five move rule':
          setResultText('和棋 - 七十五回合规则');
          setResultIcon(<MinusCircle className="w-8 h-8" />);
          setResultColor('text-blue-500');
          break;
        default:
          setResultText('游戏结束');
          setResultIcon(<CheckCircle className="w-8 h-8" />);
          setResultColor('text-green-500');
      }
    }
  }, [gameState]);

  const copyPGN = () => {
    // 这里可以实现复制PGN的功能
    navigator.clipboard.writeText('Game PGN will be copied here');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className={`flex flex-col items-center gap-4 py-4`}>
              <div className={`${resultColor} p-3 rounded-full bg-background`}>
                {resultIcon}
              </div>
              <h3 className="text-2xl font-bold">{resultText}</h3>
              <p className="text-sm text-muted-foreground">
                共 {gameState.moveHistory.length} 步
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            游戏已结束，你可以选择重新开始或分享本局游戏
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2">
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={onRestart}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新开始
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={copyPGN}
          >
            <Share2 className="w-4 h-4 mr-2" />
            复制游戏记录
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={onClose}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
