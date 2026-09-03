const blockedSegments = ["node_modules", "vendor", "dist", "build", ".git", ".next", "coverage"];
const blockedNames = [/^\.env(?:\.|$)/i, /secret/i, /credential/i, /private[-_.]?key/i, /\.pem$/i, /\.p12$/i, /id_rsa/i];
const imagePattern = /\.(png|jpe?g|gif|webp|avif)$/i;
const markdownPattern = /(^|\/)readme(?:\.[^/]*)?\.md$|\.md$/i;
const codePattern = /\.(jsx?|tsx?|css|scss|html|json|ya?ml|toml|py|go|rs|java|kt|swift|rb|php|sql|sh|md|txt)$/i;

export function isSafeProjectPath(path) {
  const normalized = String(path || "").replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("../") || normalized.includes("\0")) return false;
  const segments = normalized.split("/");
  if (segments.some((segment) => blockedSegments.includes(segment))) return false;
  return !blockedNames.some((pattern) => pattern.test(normalized));
}

export function classifyFile(path, mimeType = "") {
  if (!isSafeProjectPath(path)) return "blocked";
  if (mimeType.startsWith("image/") || imagePattern.test(path)) return "image";
  if (markdownPattern.test(path)) return "markdown";
  if (mimeType.startsWith("text/") || codePattern.test(path)) return "code";
  return "binary";
}

export function languageForPath(path) {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({ js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript", css: "CSS", scss: "SCSS", html: "HTML", json: "JSON", md: "Markdown", py: "Python", go: "Go", rs: "Rust", java: "Java", kt: "Kotlin", swift: "Swift", rb: "Ruby", php: "PHP", sql: "SQL", yml: "YAML", yaml: "YAML", toml: "TOML", sh: "Shell", png: "PNG", jpg: "JPEG", jpeg: "JPEG", webp: "WebP", gif: "GIF" })[extension] || "Text";
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export function parseGithubRepositoryUrl(value) {
  try {
    const url = new URL(value.trim());
    if (url.hostname !== "github.com") return null;
    const [owner, repo] = url.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    return owner && repo ? { owner, repo } : null;
  } catch {
    return null;
  }
}

export async function importPublicGithubRepository(value) {
  const parsed = parseGithubRepositoryUrl(value);
  if (!parsed) throw new Error("请输入有效的 GitHub 仓库地址");
  const repoResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers: { accept: "application/vnd.github+json" } });
  if (!repoResponse.ok) throw new Error("无法读取这个公开仓库；私有仓库需要先配置 GitHub App");
  const repository = await repoResponse.json();
  const branch = repository.default_branch || "main";
  const treeResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { headers: { accept: "application/vnd.github+json" } });
  if (!treeResponse.ok) throw new Error("仓库文件树读取失败");
  const tree = await treeResponse.json();
  const blobs = (tree.tree || []).filter((item) => item.type === "blob").slice(0, 5000);
  const files = blobs.map((item) => {
    const kind = classifyFile(item.path);
    const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${item.path.split("/").map(encodeURIComponent).join("/")}`;
    return {
      path: item.path,
      kind,
      language: languageForPath(item.path),
      size: item.size || 0,
      sha: item.sha,
      visibility: "private",
      remoteUrl: rawUrl,
      previewUrl: kind === "image" ? rawUrl : undefined,
      blockedReason: kind === "blocked" ? "敏感或依赖文件不会被预览" : undefined,
    };
  });
  const prioritized = files
    .filter((file) => file.kind !== "blocked" && file.kind !== "binary")
    .filter((file) => file.size <= 64 * 1024)
    .sort((a, b) => {
      if (a.path.match(/(^|\/)readme\.md$/i)) return -1;
      if (b.path.match(/(^|\/)readme\.md$/i)) return 1;
      if (a.path.match(/(^|\/)(index|main|app)\.(jsx?|tsx?|py|go|js|ts)$/i)) return -1;
      if (b.path.match(/(^|\/)(index|main|app)\.(jsx?|tsx?|py|go|js|ts)$/i)) return 1;
      return 0;
    });
  const candidates = [...new Map(prioritized.slice(0, 10).map((file) => [file.path, file])).values()];

  let readme = `# ${repository.name}\n\n${repository.description || "导入自 GitHub 的项目。"}`;
  const readmeFile = files.find((file) => /(^|\/)readme\.md$/i.test(file.path));
  const readmeReadTask = async () => {
    if (!readmeFile) return null;
    const readmeResponse = await fetch(readmeFile.remoteUrl);
    if (!readmeResponse.ok) return null;
    const text = await readmeResponse.text();
    readme = text;
    readmeFile.content = text;
    readmeFile.kind = "markdown";
    return text;
  };

  const readCodeTasks = candidates
    .filter((file) => file !== readmeFile)
    .slice(0, 6)
    .map(async (file) => {
      if (file.kind !== "code" && file.kind !== "markdown") return null;
      if (file.size > 2 * 1024 * 1024) return null;
      try {
        const response = await fetch(file.remoteUrl);
        if (!response.ok) return null;
        file.content = await response.text();
        return file.path;
      } catch {
        return null;
      }
    });

  try {
    await readmeReadTask();
  } catch {
    // Keep generated fallback readme.
  }
  try {
    await Promise.allSettled(readCodeTasks);
  } catch {
    // Keep best-effort content; import should continue.
  }

  return { repository, files, readme };
}

export async function hydrateRemoteFile(file) {
  if (file.content || !file.remoteUrl || !["code", "markdown"].includes(file.kind)) return file;
  if (file.size > 2 * 1024 * 1024) throw new Error("单个代码文件超过 2 MB，请在 GitHub 中查看");
  const response = await fetch(file.remoteUrl);
  if (!response.ok) throw new Error("远程文件读取失败");
  return { ...file, content: await response.text() };
}

function readAs(file, mode) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`无法读取 ${file.name}`));
    reader.onload = () => resolve(reader.result);
    mode === "data" ? reader.readAsDataURL(file) : reader.readAsText(file);
  });
}

export async function prepareLocalUploads(fileList) {
  const results = [];
  for (const file of Array.from(fileList)) {
    const relativePath = file.webkitRelativePath || file.name;
    const kind = classifyFile(relativePath, file.type);
    if (kind === "blocked") {
      results.push({ path: relativePath, kind, language: languageForPath(relativePath), size: file.size, sha: "blocked", visibility: "private", blockedReason: "敏感路径已自动拦截" });
      continue;
    }
    const max = kind === "image" ? 20 * 1024 * 1024 : 2 * 1024 * 1024;
    if (!["image", "code", "markdown"].includes(kind) || file.size > max) {
      results.push({ path: relativePath, kind: "binary", language: languageForPath(relativePath), size: file.size, sha: "skipped", visibility: "private", blockedReason: "文件类型或大小不支持预览" });
      continue;
    }
    const data = await readAs(file, kind === "image" ? "data" : "text");
    results.push({ path: relativePath, kind, language: languageForPath(relativePath), size: file.size, sha: `upload-${file.lastModified.toString(16)}`, visibility: "private", ...(kind === "image" ? { previewUrl: data } : { content: data }) });
  }
  return results;
}
