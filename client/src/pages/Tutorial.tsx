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

        <div className="grid md:grid-cols-2 gap-8 mb-12">
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
            description="提供 6 个难度等级的 AI 对手。从入门到宗师，难度跨度巨大。高级别引擎会通过深度搜索进行近乎完美的对局。"
          />
          <TutorialCard 
            icon={<Zap className="w-8 h-8 text-yellow-500" />}
            title="自动演示"
            description="观看引擎自对弈，理解高级棋形和残局技巧。您可以分别为白方和黑方设置不同的 AI 难度来观察博弈。"
          />
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            AI 难度等级详解 (Stockfish 10)
          </h2>
          <div className="grid gap-6">
            <Card className="glass-panel border-white/5 overflow-hidden">
              <div className="divide-y divide-white/5">
                {[
                  { name: "新手 (Novice)", elo: "800", depth: "2层", time: "100ms", desc: "极速落子，几乎没有长远计算。适合完全不了解棋局规则的初学者练习基本走法。" },
                  { name: "入门 (Beginner)", elo: "1200", depth: "5层", time: "300ms", desc: "模拟俱乐部初级棋手。会注意到简单的吃子机会，但容易掉入基础的战术陷阱。" },
                  { name: "业余 (Amateur)", elo: "1600", depth: "8层", time: "600ms", desc: "具备基础战术意识，能避开明显的单步失误。适合想要提高计算能力的爱好者。" },
                  { name: "专业 (Professional)", elo: "2000", depth: "12层", time: "1000ms", desc: "相当于省市级强力棋手。具有较强的中局博弈能力和基本残局知识。" },
                  { name: "大师 (Master)", elo: "2400", depth: "15层", time: "1500ms", desc: "职业大师水平。计算精准，防守顽强，能敏锐捕捉微小优势并将其转化为胜势。" },
                  { name: "宗师 (Grandmaster)", elo: "2800", depth: "20层", time: "3000ms", desc: "顶级对抗水平。展现深远的战略布局和极致的计算力，挑战人类极限。" },
                ].map((level, i) => (
                  <div key={i} className="p-6 flex flex-col md:flex-row gap-4 hover:bg-white/5 transition-colors">
                    <div className="w-full md:w-32 shrink-0">
                      <div className="font-bold text-primary text-lg">{level.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">ELO ~{level.elo}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-4 text-xs font-mono mb-2 text-accent">
                        <span>搜索深度: {level.depth}</span>
                        <span>单步限时: {level.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {level.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
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
