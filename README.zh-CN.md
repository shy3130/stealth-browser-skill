# 隐形浏览器技能 (Stealth Browser Skill)

一个强大的浏览器自动化技能，可以绕过反自动化检测。基于 OpenClaw 的浏览器技术。

## 🌟 特性

- ✅ **绕过反自动化检测** - 启用隐形模式
- ✅ **真实 Chrome 浏览器** - 不是无头自动化
- ✅ **持久化配置文件** - 像真实用户一样
- ✅ **AI 友好接口** - 易于智能体使用
- ✅ **截图支持** - 捕获页面状态
- ✅ **表单交互** - 填写和提交表单

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/stealth-browser-skill.git
cd stealth-browser-skill

# 安装依赖
npm install

# 安装 Chrome 扩展（见下文）
```

### 使用方法

```bash
# 启动浏览器
npm start

# 或使用 CLI
./cli/stealth-browser open https://example.com
./cli/stealth-browser screenshot
./cli/stealth-browser click @e1
```

## 📁 项目结构

```
stealth-browser-skill/
├── cli/                    # 命令行接口
├── extension/              # Chrome 扩展
├── server/                 # 中继服务器
├── lib/                    # 核心库
├── profiles/               # 浏览器配置文件
└── README.md
```

## 🔧 配置

### Chrome 扩展安装

1. 打开 Chrome 并访问 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `extension/` 文件夹

### 环境变量

```bash
export STEALTH_BROWSER_PORT=18792
export STEALTH_BROWSER_PROFILE_DIR=~/.stealth-browser/profiles
```

## 🛡️ 反检测特性

- 持久化用户数据目录
- 真实 Chrome 可执行文件
- 修改浏览器指纹
- CDP 命令过滤
- 类人行为模拟

## 📄 许可证

MIT 许可证 - 查看 [LICENSE](LICENSE)

## 🤝 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)

## 🙏 致谢

基于 OpenClaw 的浏览器技术 - https://github.com/openclaw/openclaw

## 🔗 相关链接

- [English README](README.md)
- [GitHub 仓库](https://github.com/yourusername/stealth-browser-skill)
- [问题反馈](../../issues)

---

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a>
</p>

---

**注意：** 本工具仅供学习和合法自动化测试使用，请遵守相关网站的使用条款。
