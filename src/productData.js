import { IMPORTED_PROFILE, IMPORTED_PROJECTS, IMPORTED_README_MARKDOWN } from "./profileAdapter";

export const projectStorageKey = "life-git.projects.zh-cn.v4";
export const readmeStorageKey = "life-git.profile-readme.zh-cn.v5";
// Visitors are the safe default for a fresh/local preview; Tulip can enter management mode explicitly.
export const ownerStorageKey = "life-git.owner-demo.zh-cn.v2";

const githubOwner = "tulip627722-byte";

function rawUrl(repo, branch, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${githubOwner}/${repo}/${branch}/${encoded}`;
}

function githubFile(repo, branch, path, kind, language, size, sha, visibility = "public") {
  const url = rawUrl(repo, branch, path);
  return {
    path, kind, language, size, sha, visibility,
    ...(kind === "image" ? { previewUrl: url } : { remoteUrl: url }),
  };
}

const readmes = {
  bmo: `# advx-bmo — BMO (AdventureX 2026)

一个装进口袋的 BMO：Tuya T5AI-Board 负责面部、语音与触屏，Orange Pi 3B 作为常驻大脑。

仓库覆盖 AI 交易、Photon 消息、StepFun 电脑 Agent 和 LiberNovo 常驻 Agent 四个赛道。Photon 通过语音生成草稿，再由触屏完成发送、编辑或取消确认。

这是 Adventure X 团队项目的公开仓库快照，完整架构、交接和构建说明请查看 GitHub 原始 README。`,
  antiFomo: `# 反 FOMO

“这个 AI 名词值得我花时间学吗？”

用第一性原理从核心价值、应用前景和学习成本三个维度拆解 AI 技术热点，并给出投入学习、持续关注或暂时观望的判断。

项目包含分析接口、历史记录、认证、数据库与部署配置。`,
  coffee: `# Coffee Decision

面向选择困难的咖啡比价与健康决策工具。根据清醒、省钱或健身模式调整权重，横向比较多个平台，并用 AI 给出最终购买建议。`,
  promptReverse: `# Prompt Reverse

用于分析、逆向拆解和迭代提示词的 TypeScript 工具，包含分析与优化接口、预设模板以及交互式前端。`,
  college: `# My College Work

大学课程与实践项目归档，包括 Kinect v2 RGB-D 数据处理、绿植三维重建、数理综合、花样滑冰与创业课程资料。`,
  lifeGit: `# life-git

一个把 GitHub 仓库、README 与提交记录统一到同一条个人作品时间线上展示的轻量站点，支持公开/私密控制、文件级展示和生命周期追踪。`,
};

export const HOMEPAGE_PROJECT_SLUGS = [
  "advx-bmo",
  "life-git",
  "prompt-reverse",
  "personal-following-pd",
  "my-college-work",
  "anti-fomo",
  "coffee-decision",
];

const GITHUB_PROJECTS = [
  {
    id: "github-advx-bmo", slug: "advx-bmo", name: "Adventure X · BMO / Photon",
    description: "Adventure X 2026 黑客松 Photon 赛道项目：以 Tuya T5AI 与 Orange Pi 构建可触摸、可确认、可执行的实体 Agent。",
    summary: "这是我在 Adventure X 黑客松期间完成的 BMO 原型：把一个会听、会理解、会行动的 Agent 装进实体设备。它先通过语音理解意图，再在屏幕上让人确认，最后才执行消息或其他操作。",
    highlights: ["黑客松时间：2026.07.22–07.27", "主流程：语音识别 + Touch UI + 触发执行", "加入确认机制，减少误操作", "结合 Tuya T5AI、Orange Pi 与 Photon 消息编排"],
    context: {
      title: "Adventure X 2026 黑客松",
      dates: "2026.07.22–07.27",
      track: "Photon 赛道",
      role: "实体 Agent / 交互原型",
      description: "我们把 BMO 做成一个可以被触摸、被看见、也能在关键动作前征得确认的实体伙伴。项目重点不是堆叠功能，而是探索 Agent 如何从“理解”可靠地走到“行动”。",
    },
    gallery: [
      { src: "/assets/bmo-hackathon-device.jpg", alt: "Adventure X 黑客松现场的 BMO 实体原型", caption: "现场原型：把语音、屏幕和实体按键放进一个可交互的 BMO 外壳。" },
      { src: "/assets/bmo-hackathon-character.jpg", alt: "BMO 概念形象", caption: "概念形象：用熟悉而有情绪的角色感，降低人与 Agent 第一次互动的距离。" },
    ],
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    coverAlt: "智能体设备交互界面",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/advx-bmo`, repoFullName: `${githubOwner}/advx-bmo`, defaultBranch: "main", headSha: "ac2c249", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-07-25T10:19:23Z",
    technologies: ["C", "LVGL", "IoT", "Agent"], readme: readmes.bmo,
    files: [
      githubFile("advx-bmo", "main", "README.md", "markdown", "Markdown", 3991, "60ae00a"),
      githubFile("advx-bmo", "main", "BMO_HANDOFF.md", "markdown", "Markdown", 21012, "0b03b31"),
      githubFile("advx-bmo", "main", "app/src/app_photon.c", "code", "C", 15686, "333bfc2"),
      githubFile("advx-bmo", "main", "app/src/app_face.c", "code", "C", 12517, "912e405"),
      githubFile("advx-bmo", "main", "app/src/app_brain.c", "code", "C", 16157, "96e19e0"),
    ],
  },
  {
    id: "github-anti-fomo", slug: "anti-fomo", name: "Anti-FOMO",
    description: "用第一性原理判断 AI 技术是否值得投入学习，减少名词膨胀与热点焦虑。",
    summary: "我常被技术热点刷屏，项目最核心的价值是：把“是否值得学”拆成可复用判断框架，避免盲目跟风。",
    highlights: ["先判断需求价值再决定学习深度", "结合市场、成本和风险给出建议", "产出清晰的“继续/暂停/观察”决策结果"],
    coverImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    coverAlt: "AI 讨论与决策画面",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/Anti-fomo`, repoFullName: `${githubOwner}/Anti-fomo`, defaultBranch: "main", headSha: "caef0a3", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-05-12T14:11:48Z",
    technologies: ["Next.js", "TypeScript", "AI", "SQLite"], readme: readmes.antiFomo,
    files: [
      githubFile("Anti-fomo", "main", "README.md", "markdown", "Markdown", 4857, "2a52ce6"),
      githubFile("Anti-fomo", "main", "app/page.tsx", "code", "TypeScript", 12035, "ab9b983"),
      githubFile("Anti-fomo", "main", "app/api/analyze/route.ts", "code", "TypeScript", 15530, "c030a1a"),
      githubFile("Anti-fomo", "main", "lib/db.ts", "code", "TypeScript", 3572, "0c8679f"),
      githubFile("Anti-fomo", "main", "static/index.html", "code", "HTML", 41279, "c82e055"),
    ],
  },
  {
    id: "github-coffee-decision", slug: "coffee-decision", name: "Coffee Decision",
    description: "按清醒、省钱与健身目标进行多平台咖啡比价，并生成可解释的 AI 购买建议。",
    summary: "这个项目把“挑咖啡”变成可量化的决策。不是只给你一个推荐，而是给出不同目标下的选择逻辑。",
    highlights: ["三种目标模式：清醒、预算、健康", "多平台价格对比与透明逻辑", "可解释输出：为什么这个选择更适配你"],
    coverImage: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
    coverAlt: "咖啡杯与决策界面",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/Coffee-Decision`, repoFullName: `${githubOwner}/Coffee-Decision`, defaultBranch: "main", headSha: "eed4ef7", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-06-04T08:59:36Z",
    technologies: ["React", "TypeScript", "Gemini", "Vite"], readme: readmes.coffee,
    files: [
      githubFile("Coffee-Decision", "main", "README.md", "markdown", "Markdown", 553, "196aa7e"),
      githubFile("Coffee-Decision", "main", "App.tsx", "code", "TypeScript", 3085, "f85f239"),
      githubFile("Coffee-Decision", "main", "components/ComparisonMatrix.tsx", "code", "TypeScript", 8334, "5434cc5"),
      githubFile("Coffee-Decision", "main", "components/SearchProducts.tsx", "code", "TypeScript", 8868, "9868435"),
      githubFile("Coffee-Decision", "main", "services/geminiService.ts", "code", "TypeScript", 1831, "3641737"),
    ],
  },
  {
    id: "github-prompt-reverse", slug: "prompt-reverse", name: "Prompt Reverse",
    description: "把提示词拆成结构、约束与目标，再辅助分析和迭代优化的交互工具。",
    summary: "把提示词当作“产品需求文档”来处理：先定位目标，再拆解上下文、约束和预期，避免一次成型才发现效果不稳定。",
    highlights: ["结构化拆解提示词", "给出可执行优化建议", "沉淀可复用提示词模板"],
    coverImage: "https://images.unsplash.com/photo-1516116216624-53e697fedbe0?auto=format&fit=crop&w=900&q=80",
    coverAlt: "提示词和对话交互界面",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/Prompt-reverse`, repoFullName: `${githubOwner}/Prompt-reverse`, defaultBranch: "main", headSha: "494a6be", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-06-14T09:27:40Z",
    technologies: ["React", "TypeScript", "Gemini", "Prompt"], readme: readmes.promptReverse,
    files: [
      githubFile("Prompt-reverse", "main", "README.md", "markdown", "Markdown", 542, "3ddb5af"),
      githubFile("Prompt-reverse", "main", "src/App.tsx", "code", "TypeScript", 52572, "90633f5"),
      githubFile("Prompt-reverse", "main", "api/analyze.ts", "code", "TypeScript", 5457, "2156495"),
      githubFile("Prompt-reverse", "main", "api/refine.ts", "code", "TypeScript", 3307, "6f4b8ea"),
      githubFile("Prompt-reverse", "main", "src/presets.ts", "code", "TypeScript", 9630, "90b5696"),
    ],
  },
  {
    id: "github-college", slug: "my-college-work", name: "My College Work",
    description: "课程与实践档案：Kinect v2 RGB-D 采集、绿植三维重建、Python 工具及大学学习记录。",
    summary: "把大学项目做成“可复用方法库”：从传感器采集、重建算法到展示流程，记录了从问题定义到实验迭代的全链路。",
    highlights: ["Kinect RGB-D 数据采集与配准流程", "绿植三维重建可视化", "课程实践与交付文档汇总"],
    coverImage: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
    coverAlt: "3D 重建实验数据可视化",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/my-college-work`, repoFullName: `${githubOwner}/my-college-work`, defaultBranch: "master", headSha: "b6c313a", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-06-13T09:14:09Z",
    technologies: ["Python", "Kinect", "RGB-D", "3D"], readme: readmes.college,
    files: [
      githubFile("my-college-work", "master", "Kinect v2 3d还原花盆绿植/RGB-DEPTH/README.md", "markdown", "Markdown", 6486, "ca9c872"),
      githubFile("my-college-work", "master", "Kinect v2 3d还原花盆绿植/RGB-DEPTH/kinect_sync_data_manual/reconstruct_v3.py", "code", "Python", 18367, "e92f683"),
      githubFile("my-college-work", "master", "Kinect v2 3d还原花盆绿植/RGB-DEPTH/kinect_sync_data_manual/render_results.py", "code", "Python", 5338, "68ab3e4"),
      githubFile("my-college-work", "master", "Kinect v2 3d还原花盆绿植/RGB-DEPTH/kinect_sync_data_manual/_real_view_0001.png", "image", "PNG", 162020, "117ec5b"),
      githubFile("my-college-work", "master", "Kinect v2 3d还原花盆绿植/RGB-DEPTH/kinect_sync_data_manual/screenshots/mesh_pos_front.png", "image", "PNG", 374363, "4f4a8e8"),
    ],
  },
  {
    id: "github-personal-pd", slug: "personal-following-pd", name: "Personal Following PD",
    description: "个人产品与学习方向的待整理仓库；GitHub 当前为空，保留为下一阶段入口。",
    summary: "这个仓库是我后续放置“长期跟进主题”的主入口，当前先保留结构，等下一批内容整理好后再逐步上线。",
    highlights: ["产品观察与学习方向归档", "每季度更新学习计划", "后续对外展示可直接从这里扩展"],
    coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    coverAlt: "个人成长与学习路线规划",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/Personal-following-pd`, repoFullName: `${githubOwner}/Personal-following-pd`, defaultBranch: "main", headSha: "empty", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-06-13T10:23:52Z",
    technologies: ["Product", "Planning"], readme: "# Personal Following PD\n\n这个公开仓库当前为空。", files: [],
  },
  {
    id: "github-life-git", slug: "life-git", name: "Life Git",
    description: "将 GitHub 项目、提交记录和个人主页做成长期维护的作品展示系统，支持生命周期可追踪。",
    summary: "这是当前网站本身的构想：让创作记录、项目里程碑和公开展示连成同一条可持续更新的生命线。",
    highlights: ["项目摘要驱动展示，不依赖一次性搬运仓库", "可持续更新：新内容可直接归档到主页", "访客端和管理端逻辑分离，便于长期维护"],
    coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    coverAlt: "持续迭代中的作品主页",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/life-git`, repoFullName: `${githubOwner}/life-git`, defaultBranch: "main", headSha: "0000000", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-09-01T08:00:00Z",
    technologies: ["React", "Cloudflare Workers", "D1", "R2", "GitHub API"], readme: readmes.lifeGit,
    files: [
      githubFile("life-git", "main", "README.md", "markdown", "Markdown", 3000, "life-git-readme", "public"),
      githubFile("life-git", "main", "worker/index.js", "code", "JavaScript", 6000, "life-git-worker", "private"),
    ],
  },
];

const importedSlugs = new Set(IMPORTED_PROJECTS.map((project) => project.slug));
export const INITIAL_PROJECTS = [
  ...IMPORTED_PROJECTS.map((project) => {
    const repository = GITHUB_PROJECTS.find((item) => item.slug === project.slug);
    return repository ? { ...repository, ...project, id: repository.id, sourceType: repository.sourceType, githubUrl: repository.githubUrl, repoFullName: repository.repoFullName, defaultBranch: repository.defaultBranch, headSha: repository.headSha, syncStatus: repository.syncStatus, lastSyncedAt: repository.lastSyncedAt, technologies: [...new Set([...repository.technologies, ...project.technologies])], files: repository.files } : project;
  }),
  ...GITHUB_PROJECTS.filter((project) => !importedSlugs.has(project.slug)),
];

export const RESUME_PROFILE = IMPORTED_PROFILE;

const initialReadmeMarkdown = `# 你好，我是 Tulip

我是一名 AI Product Manager，正在探索一个问题：
如何把 AI Agent 从“会回答问题”做成真正可用、可控、可验证，并能进入真实业务与生活的产品。

我喜欢从模糊问题出发，把它拆成产品机制、Agent 能力与可验证的系统，再通过真实场景不断迭代。

## 我正在做的事

**Agent Product** — 企业级 Agent Builder、Skill / Tool / Knowledge 编排与 Agent 工作流

**Agent Engineering** — Harness、Eval、Badcase 归因与 Agent 稳定性

**Agent Interaction** — 多模态、端侧 Agent，以及真实行动中的 Human-in-the-loop

**Productization** — 探索如何让 Agent 从 Demo 走向真实业务与用户场景

## 代表项目

**NIO · Enterprise Agent Platform**
参与企业级通用 Agent 基础建设，围绕 Agent 配置、Skill / Tool 编排、运行与评测，探索让业务团队能够自主构建和迭代 Agent。

**NIO · Agent Engineering / Eval Harness**
将业务反馈、需求理解、研发执行、验收与结果回流连接起来，并探索通过 Harness + Eval 建立 Agent 的持续优化闭环。

**XPeng · VUI Agent**
从复杂车载多轮交互中的真实 Badcase 出发，进行意图、上下文与交互策略设计，并建立从问题归因到评测验证的优化方法。

**Adventure X · BMO / Photon**
探索具有独立身份的实体 Agent，以及真实环境中的安全确认交互，获得 Photon 赛道第一名。

## 我相信

Agent 的核心价值不只是“更聪明地回答”。

更重要的是：
理解 → 决策 → 执行 → 确认 → 反馈 → 迭代

如何形成一个可靠的闭环。

因此，我尤其关注 Context、Skill、Memory、Tool、Eval 与 Harness 如何共同决定一个 Agent 的行为。

## Side Projects

**Life Git** — 用 Git / Commit / Evidence 记录和版本化个人成长

**Anti-FOMO** — 用第一性原理判断一项 AI 技术是否值得投入

**Coffee Decision** — 将 AI 用于真实消费决策

**Prompt Reverse** — 分析、拆解与迭代 Prompt 结构

## Currently Exploring

### Agent × Reality

如何让 Agent 从一个聊天窗口里的模型，逐渐成为能够理解环境、拥有持续状态、执行真实行动，并在关键节点与人协作确认的存在。

我也在持续把自己的项目、学习与人生记录沉淀进 Life Git，让每一次能力增长都留下可以追溯的证据。`;

export const INITIAL_README_STATE = {
  publishedId: "readme-v5", draftId: null, sourceFingerprint: "tulip-public-readme-2026-09-03",
  versions: [
    { id: "readme-v5", version: 5, status: "published", createdAt: "2026-09-03T12:00:00.000Z", publishedAt: "2026-09-03T12:00:00.000Z", generationMode: "manual-curated", markdown: initialReadmeMarkdown, sourceRefs: ["profile:tulip", "project:advx-bmo", "project:anti-fomo", "project:coffee-decision", "project:prompt-reverse"] },
  ],
};

export function sortFiles(files = []) {
  return [...files].sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path));
}

export function makeId(prefix) {
  const bytes = new Uint32Array(2); crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (value) => value.toString(16)).join("").slice(0, 10)}`;
}

export function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || `project-${Date.now()}`;
}
