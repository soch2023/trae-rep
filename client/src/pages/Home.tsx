import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Header } from "@/components/Header";
import { EvaluationBar } from "@/components/EvaluationBar";
import { OpeningTree } from "@/components/OpeningTree";
import { SystemValidator } from "@/components/SystemValidator";
import { GameResultModal } from "@/components/GameResultModal";
import { useChessGame } from "@/hooks/use-chess-game";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Cpu, Users, Sword, RotateCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DIFFICULTY_LEVELS = [
  { value: "0", label: "新手 (ELO ~800)", depth: 2 },
  { value: "1", label: "入门 (ELO ~1200)", depth: 5 },
  { value: "2", label: "业余 (ELO ~1600)", depth: 8 },
  { value: "3", label: "专业 (ELO ~2000)", depth: 12 },
  { value: "4", label: "大师 (ELO ~2400)", depth: 15 },
  { value: "5", label: "宗师 (ELO ~2800)", depth: 20 },
];

export default function Home() {
  // Validations
  const [validated, setValidated] = useState(false);
  
  // Game Result Modal
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Game Logic
  const { 
    gameState, 
    isReady, 
    evaluation, 
    aiVsAiActive, 
    isPlayerTurn,
    errors,
    isLoading,
    onDrop, 
    resetGame, 
    undoMove, 
    toggleBoardOrientation, 
    togglePlayerColor,
    setAiVsAiActive,
    safeMove,
    saveGame,
    loadGame,
    clearSavedGame,
    stop
  } = useChessGame();
  
  // Settings
  const { settings, updateSettings } = useSettings();

  // Check if game is over and show result modal
  useEffect(() => {
    if (gameState.isGameOver) {
      setShowResultModal(true);
    }
  }, [gameState.isGameOver]);

  const handleRestart = () => {
    setShowResultModal(false);
    resetGame();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      {!validated && <SystemValidator isStockfishReady={isReady} onValidationComplete={() => setValidated(true)} />}
      
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
        
        {/* LEFT: Game Board Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-background to-secondary/20 relative min-h-[500px] lg:min-h-0 w-full">
            {/* 翻转棋盘按钮 (通用) */}
            <div className="absolute top-3 right-3 lg:top-4 lg:right-8 z-20">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleBoardOrientation}
                title="翻转棋盘"
                className="rounded-full bg-card/80 backdrop-blur-sm h-8 w-8"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-3 left-3 lg:top-4 lg:left-8 flex gap-2 z-20">
               <div className="flex items-center gap-1 px-3 py-1 bg-card rounded-full border border-white/5 text-[9px] lg:text-xs font-mono">
                 <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <span className="hidden sm:inline">STOCKFISH 10</span>
               </div>
            </div>

          <div className="flex gap-2 lg:gap-4 items-stretch h-auto w-full max-w-[600px] aspect-square touch-none overscroll-none p-1">
            {/* 评估条 (Eval Bar) */}
            <div className="h-full py-[1%] hidden sm:block">
              <EvaluationBar cp={evaluation.cp} mate={evaluation.mate} />
            </div>
            
      {/* 棋盘 (Board) */}
      <div className="aspect-square flex-1 board-wrapper rounded-lg overflow-hidden border-2 lg:border-4 border-card bg-card shadow-2xl relative select-none">
        <Chessboard 
          position={gameState.fen} 
          onPieceDrop={onDrop}
          customDarkSquareStyle={{ backgroundColor: "#779556" }}
          customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
          animationDuration={0}
          boardOrientation={settings.boardOrientation || 'white'}
          areArrowsAllowed={false}
          boardWidth={Math.min(document.documentElement.clientWidth * 0.9, 600)}
        />
      </div>
          </div>

          {/* Game Controls Panel */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 bg-card/50 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
             <Button 
                variant="ghost" 
                size="sm"
                className="flex gap-2"
                onClick={undoMove}
                disabled={aiVsAiActive || gameState.moveHistory.length === 0}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">悔棋</span>
              </Button>

             {settings.gameMode === 'aiVsAi' ? (
                <div className="w-full max-w-xs flex flex-col items-center gap-3">
                  <div className="flex gap-4 w-full justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">白方</span>
                      <Select 
                        value={(settings.whiteAIDifficulty ?? 1).toString()} 
                        onValueChange={(v) => updateSettings({ ...settings, whiteAIDifficulty: parseInt(v) })}
                      >
                         <SelectTrigger className="h-7 w-20 bg-background text-[10px]">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {DIFFICULTY_LEVELS.map(level => (
                             <SelectItem key={level.value} value={level.value}>{level.label.split(' ')[0]}</SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">黑方</span>
                      <Select 
                        value={(settings.blackAIDifficulty ?? 2).toString()} 
                        onValueChange={(v) => updateSettings({ ...settings, blackAIDifficulty: parseInt(v) })}
                      >
                         <SelectTrigger className="h-7 w-20 bg-background text-[10px]">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {DIFFICULTY_LEVELS.map(level => (
                             <SelectItem key={level.value} value={level.value}>{level.label.split(' ')[0]}</SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setAiVsAiActive(!aiVsAiActive)}
                    className={aiVsAiActive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"}
                  >
                    {aiVsAiActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {aiVsAiActive ? "暂停" : "开始"}
                  </Button>
                </div>
             ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1 bg-background/30 rounded-full">
                   {settings.gameMode === 'vsAI' ? <Cpu className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                   <span className="hidden sm:inline">{settings.gameMode === 'vsAI' ? "人机对弈" : "本地对战"}</span>
                </div>
             )}

             <div className="w-full flex flex-wrap justify-center gap-2 mt-2">
               <Button size="sm" variant="secondary" onClick={resetGame}>重新开始</Button>
               <Button 
                 size="sm"
                 variant="ghost" 
                 onClick={saveGame}
                 disabled={isLoading}
               >
                 保存
               </Button>
               <Button 
                 size="sm"
                 variant="ghost" 
                 onClick={loadGame}
                 disabled={isLoading}
               >
                 加载
               </Button>
             </div>
          </div>
        </div>

        {/* RIGHT: Analysis & Stats Panel */}
        <div className="w-full lg:w-[400px] bg-card border-l border-white/5 flex flex-col h-full z-10">
          
          {/* 活跃模式标题 */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-card to-secondary/30">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sword className="w-5 h-5 text-primary" />
              {settings.gameMode === 'aiVsAi' ? "引擎对局演示" : settings.gameMode === 'vsAI' ? "人机对练" : "本地双人对战"}
            </h2>
            
            {settings.gameMode === 'vsAI' && (
              <div className="mt-4 space-y-4">
                 <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">玩家执色</label>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="h-7 text-[10px] px-2"
                       onClick={togglePlayerColor}
                     >
                       交换角色
                     </Button>
                   </div>
                   <div className="flex gap-2 p-1 bg-background/50 rounded-lg border border-white/10">
                     <Button 
                       variant={settings.playerColor === 'w' ? 'default' : 'ghost'} 
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSettings({ ...settings, playerColor: 'w' })}
                     >
                       执白
                     </Button>
                     <Button 
                       variant={settings.playerColor === 'b' ? 'default' : 'ghost'} 
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSettings({ ...settings, playerColor: 'b' })}
                     >
                       执黑
                     </Button>
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">引擎难度</label>
                   <Select 
                     value={settings.aiDifficulty.toString()} 
                     onValueChange={(v) => updateSettings({ ...settings, aiDifficulty: parseInt(v) })}
                   >
                      <SelectTrigger className="w-full bg-background border-white/10">
                        <SelectValue placeholder="选择难度" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 </div>
              </div>
            )}
          </div>

          {/* 引擎信息 */}
          <div className="p-4 grid grid-cols-2 gap-4 border-b border-white/5">
             <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <span className="text-xs text-muted-foreground block mb-1">局势评估</span>
                <span className={`font-mono font-bold text-lg ${evaluation.cp > 0 ? "text-green-500" : "text-red-500"}`}>
                   {evaluation.cp > 0 ? "+" : ""}{(evaluation.cp / 100).toFixed(2)}
                </span>
             </div>
             <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <span className="text-xs text-muted-foreground block mb-1">引擎推荐</span>
                <span className="font-mono font-bold text-lg text-primary">
                   {evaluation.bestMove || "-"}
                </span>
             </div>
          </div>

          {/* 引擎性能信息 */}
          <div className="p-4 border-b border-white/5 bg-background/20">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">搜索深度:</span>
                <span className="ml-2 font-mono">{evaluation.depth}</span>
              </div>
              <div>
                <span className="text-muted-foreground">节点数:</span>
                <span className="ml-2 font-mono">{evaluation.nodes.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">搜索速度:</span>
                <span className="ml-2 font-mono">{(evaluation.nps / 1000).toFixed(1)}k NPS</span>
              </div>
              <div>
                <span className="text-muted-foreground">游戏状态:</span>
                <span className="ml-2 font-mono">
                  {gameState.isGameOver ? '结束' : '进行中'}
                </span>
              </div>
            </div>
          </div>

          {/* Opening Explorer */}
          <div className="flex-1 overflow-hidden p-4">
            <OpeningTree fen={gameState.fen} onMoveSelect={(san) => safeMove(san)} />
          </div>

          {/* 历史记录 */}
          <div className="h-48 border-t border-white/5 p-4 bg-background/30 overflow-y-auto">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">着法记录</h3>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                {gameState.moveHistory.map((move, i) => {
                  if (i % 2 === 0) {
                     return (
                        <div key={i} className="flex gap-4 border-b border-white/5 py-1">
                           <span className="text-muted-foreground w-6">{(i/2 + 1)}.</span>
                           <span className="text-foreground">{move}</span>
                           <span className="text-foreground">{gameState.moveHistory[i+1] || ""}</span>
                        </div>
                     );
                  }
                  return null;
                })}
             </div>
          </div>

        </div>
      </main>
      
      {/* Game Result Modal */}
      <GameResultModal 
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
        onRestart={handleRestart}
      />
    </div>
  );
}