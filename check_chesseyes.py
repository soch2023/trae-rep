import os
import subprocess

def check_stockfish():
    print("🔍 正在检查 Stockfish 引擎...")
    try:
        result = subprocess.run(["stockfish", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Stockfish 引擎正常：", result.stdout.strip())
            return True
        else:
            print("❌ Stockfish 引擎调用失败")
            return False
    except FileNotFoundError:
        print("❌ Stockfish 未安装，请执行 sudo apt-get install stockfish -y")
        return False

def check_opening_trees():
    print("\n🔍 正在检查开局树文件...")
    tree_dir = "./opening-trees"
    required_files = ["e4.tree", "d4.tree", "c4.tree", "Nf3.tree"]
    if not os.path.exists(tree_dir):
        print("❌ 开局树目录不存在")
        return False

    for file in required_files:
        file_path = os.path.join(tree_dir, file)
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                content = f.read()
                if "CP Gap" in content:
                    print(f"✅ {file} 格式合规")
                else:
                    print(f"⚠️ {file} 缺少 CP Gap 标注")
        else:
            print(f"❌ {file} 缺失")
            return False
    return True

def check_web_page():
    print("\n🔍 正在检查网页核心文件...")
    web_files = ["index.html", "style.css", "app.js"]
    for file in web_files:
        if os.path.exists(file):
            print(f"✅ {file} 存在")
        else:
            print(f"❌ {file} 缺失")
            return False
    return True

if __name__ == "__main__":
    print("===== ChessEyes 项目启动自检 =====")
    engine_ok = check_stockfish()
    tree_ok = check_opening_trees()
    page_ok = check_web_page()

    print("\n===== 自检结果汇总 =====")
    if engine_ok and tree_ok and page_ok:
        print("🎉 所有功能正常，可正常启动项目！")
    else:
        print("❌ 存在问题，请修复后再启动！")