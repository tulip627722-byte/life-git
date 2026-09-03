import profileImport from "./content/tulip-profile.json";

const publicOnly = (items = []) => items.filter((item) => (item.visibility || profileImport.import_options?.default_visibility) === "public");
const trim = (value = "") => String(value).trim();

function normalizeDate(value) {
  const match = String(value || "").match(/^(\d{4})[.-](\d{2})(?:[.-](\d{2}))?/);
  return match ? `${match[1]}-${match[2]}-${match[3] || "01"}` : "2026-01-01";
}

function commitType(value) {
  return ({ milestone: "Milestone", startup: "Project", work: "Experience", build: "Project", learning: "Learning", idea: "Idea", life: "Life" })[value] || "Life";
}

function projectReadme(project) {
  const sections = [
    `# ${project.name}`,
    project.one_liner,
    project.background && `## 项目背景\n\n${trim(project.background)}`,
    (project.description || project.idea) && `## 项目介绍\n\n${trim(project.description || project.idea)}`,
    project.product_idea && `## 产品思路\n\n${trim(project.product_idea)}`,
    project.role && `## 我的角色\n\n${project.role}`,
    (project.responsibilities || project.key_design || project.interaction?.core_objects)?.length && `## 关键工作\n\n${(project.responsibilities || project.key_design || project.interaction.core_objects).map((item) => `- ${item}`).join("\n")}`,
    project.evidence?.length && `## 事实与结果\n\n${project.evidence.map((item) => `- ${item}`).join("\n")}`,
    (project.personal_takeaway || project.personal_meaning) && `## 对我的意义\n\n${trim(project.personal_takeaway || project.personal_meaning)}`,
  ];
  return sections.filter(Boolean).join("\n\n");
}

const importedProjects = publicOnly(profileImport.projects);

export const IMPORTED_PROJECTS = importedProjects.map((project) => ({
  id: `profile-${project.id}`,
  slug: project.id,
  name: project.name,
  description: project.one_liner || trim(project.description || project.idea),
  sourceType: "profile",
  githubUrl: project.github || "",
  repoFullName: "",
  defaultBranch: "profile",
  headSha: "profile-v1",
  visibility: "public",
  syncStatus: "local",
  lastSyncedAt: "2026-08-26T00:00:00.000Z",
  technologies: project.technologies || String(project.type || "Product").split("/").map(trim).filter(Boolean),
  readme: projectReadme(project),
  files: [],
  featured: (profileImport.featured || []).some((item) => item.type === "project" && item.id === project.id),
  profileData: project,
}));

export const IMPORTED_COMMITS = (profileImport.life_commits || []).map((commit, index) => {
  const date = normalizeDate(commit.date);
  return {
    id: `life${String(index + 1).padStart(3, "0")}`,
    title: commit.title,
    description: trim(commit.description),
    rawContent: trim(commit.description),
    type: commitType(commit.type),
    date,
    tags: commit.tags || [],
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    enrichment: null,
  };
});

const skills = profileImport.skills || [];
const experiences = publicOnly(profileImport.experiences);

export const IMPORTED_PROFILE = {
  displayName: profileImport.profile.display_name,
  englishName: profileImport.profile.english_name,
  contact: {
    github: profileImport.contact?.github || "",
    taraUrl: profileImport.contact?.tara_url || profileImport.contact?.tara || "",
    xiaohongshuUrl: profileImport.contact?.xiaohongshu_url || profileImport.contact?.xiaohongshu || "",
  },
  headline: profileImport.profile.headline,
  tagline: profileImport.profile.tagline,
  summary: trim(profileImport.profile.short_intro),
  longIntro: trim(profileImport.profile.long_intro),
  selfDefinition: trim(profileImport.personality?.self_definition),
  education: {
    school: profileImport.profile.education.school,
    program: `${profileImport.profile.education.program} · ${profileImport.profile.education.degree}`,
    period: profileImport.profile.education.period,
    detail: trim(profileImport.education?.[0]?.description),
    meaning: trim(profileImport.education?.[0]?.personal_meaning),
  },
  experiences: experiences.map((experience) => ({
    company: experience.organization,
    role: experience.role,
    period: experience.period,
    positioning: experience.positioning,
    summary: trim(experience.description),
    oneLiner: experience.one_liner,
    points: experience.evidence || experience.major_projects?.flatMap((project) => project.evidence || []) || [],
    projects: (experience.major_projects || experience.major_work || []).map((project) => ({
      name: project.name,
      role: project.role || "",
      description: trim(project.description),
      evidence: project.evidence || project.key_questions || [],
    })),
    takeaway: trim(experience.personal_takeaway),
  })),
  highlights: importedProjects.map((project) => ({
    title: project.name,
    meta: [project.role, project.type, project.period].filter(Boolean).join(" · "),
    detail: project.one_liner || trim(project.description || project.idea),
  })),
  skills: [...new Set(skills.flatMap((group) => group.items || []))],
  skillGroups: skills,
  traits: profileImport.personality?.core_traits || [],
  workingStyle: profileImport.personality?.working_style || [],
  technicalBackground: Object.values(profileImport.technical_background || {}),
  interests: profileImport.interests || {},
  philosophy: profileImport.philosophy || {},
};

const readme = profileImport.readme || {};
export const IMPORTED_README_MARKDOWN = [
  `# ${readme.title || "Hi, I'm Tulip."}`,
  `> ${trim(readme.opening).replace(/\n/g, " ")}`,
  trim(readme.body),
  `## 从 AI 多模态到 Agent\n\n${trim(readme.experience_story)}`,
  `## 硬件、产品与真实世界\n\n${trim(readme.hardware_story)}`,
  `## Builder 的另一面\n\n${trim(readme.builder_story)}`,
  `## 现在的我\n\n${trim(readme.current_state)}`,
  `## 我想保留的东西\n\n${trim(readme.personal_statement)}`,
  `---\n\n${trim(profileImport.philosophy?.final_tagline)}`,
].filter(Boolean).join("\n\n");

export const PROFILE_IMPORT_SETTINGS = profileImport.import_options;
