import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Cpu, History, Zap } from "lucide-react";

export default function Tutorial() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto p-8 w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            掌握棋局
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            学习如何使用我们的高级分析工具来提升您的国际象棋水平。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <TutorialCard 
            icon={<Cpu className="w-8 h-8 text-primary" />}
            title="引擎分析"
            description="集成的 Stockfish 10 引擎提供实时的局势评估。评估条直观显示双方优劣，'推荐着法' 指示器帮您找到当前最佳延续。"
          />
          <TutorialCard 
            icon={<History className="w-8 h-8 text-accent" />}
            title="开局百科"
            description="访问 Lichess Masters 数据库，查看顶级棋手如何处理当前的局面。查看胜率和出现频率，选择最符合棋理的着法。"
          />
          <TutorialCard 
            icon={<Brain className="w-8 h-8 text-purple-500" />}
            title="人机对战"
            description="提供 3 个难度等级的 AI 对手。'菜鸟' 等级会经常犯错，而 '大师' 等级则通过深度搜索进行近乎完美的对局。"
          />
          <TutorialCard 
            icon={<Zap className="w-8 h-8 text-yellow-500" />}
            title="自动演示"
            description="观看引擎自对弈，理解高级棋形和残局技巧。您可以随时暂停并恢复自动对弈过程。"
          />
        </div>
      </main>
    </div>
  );
}

function TutorialCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="glass-panel border-white/5">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle className="font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
