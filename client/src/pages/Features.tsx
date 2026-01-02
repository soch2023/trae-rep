import { Header } from "@/components/Header";
import { Check } from "lucide-react";

export default function Features() {
  const features = [
    "集成 Stockfish 10 WASM 引擎",
    "实时分值评估条 (Centipawn Evaluation)",
    "Lichess Masters 大师开局数据库",
    "3 种对弈模式：本地双人、人机对练、引擎自战",
    "可调节的 AI 引擎难度等级",
    "着法历史记录与 PGN 导出 (即将推出)",
    "深度优化的暗黑风格 UI",
    "全设备响应式移动端设计",
    "系统健康自检与验证模块"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto p-8 w-full flex flex-col justify-center">
        <h1 className="text-4xl font-display font-bold mb-8">特性列表</h1>
        
        <div className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl">
           <ul className="space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg">{feature}</span>
                </li>
              ))}
           </ul>
        </div>

        <div className="mt-12 text-center text-muted-foreground">
           <p>版本 1.0.0 • 基于 React, Vite & Stockfish 构建</p>
        </div>
      </main>
    </div>
  );
}
