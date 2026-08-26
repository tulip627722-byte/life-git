import { IMPORTED_COMMITS } from "./profileAdapter";

export const COMMIT_TYPES = ["Life", "Project", "Learning", "Idea", "Experience", "Travel", "Milestone"];

export const INITIAL_COMMITS = [
  ...IMPORTED_COMMITS,
  { id: "a7f3c9e", title: "学习 Agent Harness", description: "探索了 Agent Harness 的设计模式，并完成一个小型原型。", rawContent: "今天系统学习了 Agent Harness，也动手完成了一个小型原型。", type: "Learning", date: "2026-08-19", tags: ["AI", "产品"], createdAt: "2026-08-19T21:42:00.000Z", updatedAt: "2026-08-19T21:42:00.000Z", enrichment: { topics: ["Agent", "Harness"], insight: "Builder 身份" } },
  { id: "c3b1a7d", title: "启动新的 AI 项目", description: "搭建仓库、定义 MVP，并选定第一批任务。", rawContent: "搭建了项目仓库，定义了 MVP，也选定了第一批要做的任务。", type: "Project", date: "2026-08-17", tags: ["AI", "Builder"], createdAt: "2026-08-17T18:15:00.000Z", updatedAt: "2026-08-17T18:15:00.000Z", enrichment: null },
  { id: "9e2d4b1", title: "参加 Hackathon", description: "团队组建完成，确定了问题方向与技术栈。", rawContent: "第一次参加 Hackathon，团队已经组好，也确定了问题方向和技术栈。", type: "Experience", date: "2026-08-15", tags: ["Hackathon", "团队"], createdAt: "2026-08-15T11:03:00.000Z", updatedAt: "2026-08-15T11:03:00.000Z", enrichment: null },
  { id: "d1f8e22", title: "一个新的想法", description: "做一个能自动转写并标记想法的语音日记。", rawContent: "想到可以做一个语音日记，让它自动转写并给想法打标签。", type: "Idea", date: "2026-08-12", tags: ["语音", "日记"], createdAt: "2026-08-12T20:47:00.000Z", updatedAt: "2026-08-12T20:47:00.000Z", enrichment: null },
  { id: "b6a9d0f", title: "大学阶段里程碑", description: "完成大二，决定下一阶段重点投入的方向。", rawContent: "完成了大学第二年，也开始认真选择下一阶段要重点投入的方向。", type: "Milestone", date: "2026-08-08", tags: ["大学", "章节"], createdAt: "2026-08-08T16:21:00.000Z", updatedAt: "2026-08-08T16:21:00.000Z", enrichment: null },
  { id: "8c1f204", title: "完成第一次实习交付", description: "把研究笔记变成了团队真正使用的产品流程。", rawContent: "第一次在实习中完成完整交付，把研究笔记变成了团队真正使用的产品流程。", type: "Experience", date: "2025-07-28", tags: ["实习", "产品"], createdAt: "2025-07-28T09:30:00.000Z", updatedAt: "2025-07-28T09:30:00.000Z", enrichment: null },
  { id: "4b98e61", title: "进入大学", description: "开启新的章节，也开始学习如何构建软件。", rawContent: "进入大学，开启一个新的章节，也第一次认真学习如何构建软件。", type: "Milestone", date: "2024-09-01", tags: ["大学", "开始"], createdAt: "2024-09-01T08:00:00.000Z", updatedAt: "2024-09-01T08:00:00.000Z", enrichment: null },
];

export const REPOSITORY_VIEWS = [
  { id: "chapters", name: "人生章节", description: "那些改变方向的重要阶段", types: ["Milestone", "Life"] },
  { id: "projects", name: "项目", description: "我选择构建并交付的事情", types: ["Project"] },
  { id: "ideas", name: "想法", description: "值得继续追踪的开放线索", types: ["Idea"] },
  { id: "knowledge", name: "知识", description: "学会并能够复用的内容", types: ["Learning"] },
  { id: "experiences", name: "经历", description: "工作、关系与人生转折", types: ["Experience"] },
  { id: "journeys", name: "旅程", description: "成为人生故事一部分的地方", types: ["Travel"] },
];

export const RELEASES = [
  { version: "v2.0.0", title: "大学", range: "2024 — 2026", releasedOn: "2026 年 5 月 31 日", commits: 42, activeDays: 156, changes: ["进入大学", "开始学习编程", "第一次参加 Hackathon", "完成第一个 AI 项目"], notes: "完成大学第二年，夯实基础，也开始构建能够持续扩展的系统。" },
  { version: "v1.0.0", title: "高中", range: "2021 — 2024", releasedOn: "2024 年 6 月 10 日", commits: 28, activeDays: 109, changes: ["发现对产品的热爱", "完成第一个 Side Project", "选择新的方向"], notes: "在这个版本里，好奇心第一次变成了方向。" },
];

export const storageKey = "life-git-demo.commits.zh-cn.v3";

export function makeCommitId() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("").slice(0, 7);
}

export function sortCommits(commits) {
  return [...commits].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}
