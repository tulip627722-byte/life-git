import { IMPORTED_PROFILE, IMPORTED_PROJECTS, IMPORTED_README_MARKDOWN } from "./profileAdapter";

export const projectStorageKey = "life-git.projects.zh-cn.v3";
export const readmeStorageKey = "life-git.profile-readme.zh-cn.v3";
export const ownerStorageKey = "life-git.owner-demo.zh-cn.v1";

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
};

const GITHUB_PROJECTS = [
  {
    id: "github-advx-bmo", slug: "advx-bmo", name: "Adventure X · BMO / Photon",
    description: "Adventure X 赛道第一名项目：以 Tuya T5AI 与 Orange Pi 构建可触摸、可确认、可执行的实体 Agent。",
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
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/Personal-following-pd`, repoFullName: `${githubOwner}/Personal-following-pd`, defaultBranch: "main", headSha: "empty", visibility: "public", syncStatus: "synced", lastSyncedAt: "2026-06-13T10:23:52Z",
    technologies: ["Product", "Planning"], readme: "# Personal Following PD\n\n这个公开仓库当前为空。", files: [],
  },
  {
    id: "github-prompt-notes", slug: "prompt-notes", name: "Prompt Notes",
    description: "提示词实验与资料整理的极简公开仓库。",
    sourceType: "github", githubUrl: `https://github.com/${githubOwner}/-prompt`, repoFullName: `${githubOwner}/-prompt`, defaultBranch: "main", headSha: "7c9f41f", visibility: "public", syncStatus: "synced", lastSyncedAt: "2025-12-26T06:28:43Z",
    technologies: ["Prompt", "Notes"], readme: "# -prompt", files: [githubFile("-prompt", "main", "README.md", "markdown", "Markdown", 9, "7c9f41f")],
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

我是一名关注 **Agent 产品、AI 评测与多模态交互** 的 AI 产品实习生，也在持续把模糊想法做成可以使用和验证的原型。

## 当前关注

- 企业级 Agent Builder、研发 Agent 与 Harness
- 多 Skill / Tool / Knowledge Base 编排
- AI 评测、Badcase 分析与业务指标闭环
- 端侧 Agent 和可确认的人机交互

## 代表项目

- **Adventure X · BMO / Photon** — 实体 Agent 设备与安全确认交互，赛道第一名
- **Anti-FOMO** — 用第一性原理判断 AI 技术是否值得学习
- **Coffee Decision** — 面向真实决策场景的咖啡比价与 AI 推荐
- **Prompt Reverse** — 提示词结构分析与迭代工具

## 能力与证据

我在蔚来参与企业级 Agent Builder、研发 Agent 和 AI 评测工作；在小鹏参与多模态交互策略与评测优化。项目中持续使用 PRD、原型、Python / SQL、Harness、多 Skill 编排和数据分析。

## 最近变化

我正在把 GitHub 项目、Life Commit 和履历证据整合进 Life Git，让每项能力都能追溯到真实项目与记录。

## 正在探索

如何让 AI Agent 更可控、更可评测，并在人类确认后安全地完成真实行动。`;

export const INITIAL_README_STATE = {
  publishedId: "readme-v3", draftId: "readme-v4", sourceFingerprint: "profile-import-2026-08-26",
  versions: [
    { id: "readme-v4", version: 4, status: "draft", createdAt: "2026-08-26T12:00:00.000Z", publishedAt: null, generationMode: "profile-import", markdown: IMPORTED_README_MARKDOWN, sourceRefs: ["profile-import:1.0", "experience:nio-agent", "experience:xpeng-multimodal", "project:x-bort", "project:anti-fomo", "project:life-git"] },
    { id: "readme-v3", version: 3, status: "published", createdAt: "2026-08-21T15:30:00.000Z", publishedAt: "2026-08-21T15:30:00.000Z", generationMode: "github-resume-curated", markdown: initialReadmeMarkdown, sourceRefs: ["github:advx-bmo", "github:Anti-fomo", "github:Coffee-Decision", "github:Prompt-reverse", "resume:AI产品实习生-Agent产品版-V5"] },
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
