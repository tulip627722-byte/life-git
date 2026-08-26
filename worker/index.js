const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const BLOCKED_SEGMENTS = new Set(["node_modules", "vendor", "dist", "build", ".git", ".next", "coverage"]);
const BLOCKED_NAMES = [/^\.env(?:\.|$)/i, /secret/i, /credential/i, /private[-_.]?key/i, /\.pem$/i, /\.p12$/i, /id_rsa/i];
const IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|avif)$/i;
const TEXT_PATTERN = /\.(jsx?|tsx?|css|scss|html|json|ya?ml|toml|py|go|rs|java|kt|swift|rb|php|sql|sh|md|txt)$/i;

function json(data, status = 200, headers = {}) { return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...headers } }); }
function apiError(message, status = 400, code = "bad_request") { return json({ error: message, code }, status); }
function now() { return new Date().toISOString(); }
function makeId(prefix = "id") { return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`; }
function getDb(env) { if (!env.DB) throw new Error("D1_NOT_CONFIGURED"); return env.DB; }
function getFiles(env) { if (!env.FILES) throw new Error("R2_NOT_CONFIGURED"); return env.FILES; }
function normalizePath(value) { return String(value || "").replace(/\\/g, "/").replace(/^\/+/, ""); }

export function isSafePath(value) {
  const path = normalizePath(value);
  if (!path || path.includes("../") || path.includes("\0")) return false;
  if (path.split("/").some((part) => BLOCKED_SEGMENTS.has(part))) return false;
  return !BLOCKED_NAMES.some((pattern) => pattern.test(path));
}

export function classifyPath(path, contentType = "") {
  if (!isSafePath(path)) return "blocked";
  if (contentType.startsWith("image/") || IMAGE_PATTERN.test(path)) return "image";
  if (/\.md$/i.test(path)) return "markdown";
  if (contentType.startsWith("text/") || TEXT_PATTERN.test(path)) return "code";
  return "binary";
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.get("cookie") || "").split(";").map((item) => item.trim()).filter(Boolean).map((item) => { const index = item.indexOf("="); return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))]; }));
}
function bytesToBase64Url(bytes) {
  let value = ""; for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
}
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
async function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const left = new TextEncoder().encode(a); const right = new TextEncoder().encode(b);
  let difference = 0; for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
async function makeSession(ownerId, secret) {
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ ownerId: String(ownerId), exp: Date.now() + 7 * 86400000 })));
  return `${payload}.${await hmac(payload, secret)}`;
}
async function verifySession(token, secret, expectedOwnerId) {
  try {
    const [payload, signature] = token.split(".");
    if (!await timingSafeEqual(signature, await hmac(payload, secret))) return false;
    const value = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
    return value.exp > Date.now() && String(value.ownerId) === String(expectedOwnerId);
  } catch { return false; }
}
async function isOwner(request, env) {
  if (env.DEV_OWNER_TOKEN && request.headers.get("x-life-git-owner") === env.DEV_OWNER_TOKEN) return true;
  if (!env.SESSION_SECRET || !env.OWNER_GITHUB_ID) return false;
  return verifySession(parseCookies(request).life_git_session || "", env.SESSION_SECRET, env.OWNER_GITHUB_ID);
}
async function requireOwner(request, env) { return await isOwner(request, env) ? null : apiError("需要 Tulip 管理员身份", 401, "unauthorized"); }

async function readJson(request) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) throw new Error("JSON_REQUIRED");
  return request.json();
}
function parseGithubUrl(value) {
  try { const url = new URL(value); if (url.hostname !== "github.com") return null; const [owner, repo] = url.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/"); return owner && repo ? { owner, repo } : null; }
  catch { return null; }
}
function languageForPath(path) {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({ js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript", css: "CSS", html: "HTML", json: "JSON", md: "Markdown", py: "Python", go: "Go", rs: "Rust", java: "Java", kt: "Kotlin", swift: "Swift", rb: "Ruby", php: "PHP", sql: "SQL", yml: "YAML", yaml: "YAML", toml: "TOML", sh: "Shell", png: "PNG", jpg: "JPEG", jpeg: "JPEG", webp: "WebP", gif: "GIF" })[extension] || "Text";
}
function slugify(value) { return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || `project-${Date.now()}`; }

function derLength(length) {
  if (length < 128) return Uint8Array.of(length);
  const bytes = []; let remaining = length; while (remaining) { bytes.unshift(remaining & 255); remaining >>= 8; }
  return Uint8Array.of(128 | bytes.length, ...bytes);
}
function der(tag, content) { return Uint8Array.of(tag, ...derLength(content.length), ...content); }
function concat(...arrays) { const length = arrays.reduce((sum, item) => sum + item.length, 0); const result = new Uint8Array(length); let offset = 0; for (const item of arrays) { result.set(item, offset); offset += item.length; } return result; }
function pemBytes(pem) { return Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), (char) => char.charCodeAt(0)); }
function privateKeyPkcs8(pem) {
  if (pem.includes("BEGIN PRIVATE KEY")) return pemBytes(pem);
  const pkcs1 = pemBytes(pem); const version = der(0x02, Uint8Array.of(0)); const rsaOid = Uint8Array.of(0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00); const octet = der(0x04, pkcs1);
  return der(0x30, concat(version, rsaOid, octet));
}
async function githubAppJwt(env) {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) throw new Error("GITHUB_APP_NOT_CONFIGURED");
  const header = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))); const issuedAt = Math.floor(Date.now() / 1000) - 30; const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ iat: issuedAt, exp: issuedAt + 540, iss: env.GITHUB_APP_ID }))); const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("pkcs8", privateKeyPkcs8(env.GITHUB_APP_PRIVATE_KEY), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]); const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}
async function installationToken(env, installationId) {
  if (!installationId) return env.GITHUB_PUBLIC_TOKEN || null;
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, { method: "POST", headers: { accept: "application/vnd.github+json", authorization: `Bearer ${await githubAppJwt(env)}`, "user-agent": "life-git" } });
  if (!response.ok) throw new Error(`GITHUB_INSTALLATION_TOKEN_${response.status}`);
  return (await response.json()).token;
}
async function githubFetch(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, { ...options, headers: { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "life-git", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`GITHUB_${response.status}`);
  return response.json();
}

async function upsertProjectTree(env, project, token) {
  const repository = await githubFetch(`/repos/${project.repo_full_name}`, token); const branch = repository.default_branch || project.default_branch || "main"; const tree = await githubFetch(`/repos/${project.repo_full_name}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token); const blobs = (tree.tree || []).filter((item) => item.type === "blob").slice(0, 5000); const db = getDb(env); const timestamp = now();
  await db.prepare("UPDATE projects SET default_branch = ?, head_sha = ?, sync_status = 'synced', last_synced_at = ?, updated_at = ? WHERE id = ?").bind(branch, tree.sha || project.head_sha, timestamp, timestamp, project.id).run();
  const existing = await db.prepare("SELECT path, sha, storage_key FROM project_files WHERE project_id = ?").bind(project.id).all(); const byPath = new Map((existing.results || []).map((item) => [item.path, item])); const statements = [];
  for (const item of blobs) {
    const kind = classifyPath(item.path); const previous = byPath.get(item.path); const storageKey = previous?.sha === item.sha ? previous.storage_key : null;
    statements.push(db.prepare("INSERT INTO project_files (id, project_id, path, kind, language, size, sha, storage_key, remote_url, visibility, blocked_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT visibility FROM project_files WHERE project_id = ? AND path = ?), 'private'), ?, ?, ?) ON CONFLICT(project_id, path) DO UPDATE SET kind=excluded.kind, language=excluded.language, size=excluded.size, sha=excluded.sha, storage_key=excluded.storage_key, remote_url=excluded.remote_url, blocked_reason=excluded.blocked_reason, updated_at=excluded.updated_at").bind(makeId("file"), project.id, item.path, kind, languageForPath(item.path), item.size || 0, item.sha, storageKey, `https://raw.githubusercontent.com/${project.repo_full_name}/${branch}/${item.path.split("/").map(encodeURIComponent).join("/")}`, project.id, item.path, kind === "blocked" ? "sensitive_path" : null, timestamp, timestamp));
  }
  for (let index = 0; index < statements.length; index += 75) await db.batch(statements.slice(index, index + 75));
  return { files: blobs.length, truncated: Boolean(tree.truncated) || blobs.length >= 5000, headSha: tree.sha };
}

async function handleGithubAuth(request, env, url) {
  if (url.pathname === "/api/auth/github/start") {
    if (!env.GITHUB_CLIENT_ID || !env.SESSION_SECRET) return apiError("GitHub 登录尚未配置", 503, "service_not_configured");
    const state = crypto.randomUUID(); const redirect = new URL("https://github.com/login/oauth/authorize"); redirect.searchParams.set("client_id", env.GITHUB_CLIENT_ID); redirect.searchParams.set("redirect_uri", `${url.origin}/api/auth/github/callback`); redirect.searchParams.set("state", state);
    return new Response(null, { status: 302, headers: { location: redirect.toString(), "set-cookie": `life_git_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/` } });
  }
  if (url.pathname === "/api/auth/github/callback") {
    const state = url.searchParams.get("state"); if (!state || state !== parseCookies(request).life_git_oauth_state) return apiError("GitHub 登录状态已失效", 400, "invalid_oauth_state");
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get("code"), redirect_uri: `${url.origin}/api/auth/github/callback` }) }); const token = await tokenResponse.json(); if (!token.access_token) return apiError("GitHub 登录失败", 401, "github_auth_failed");
    const user = await githubFetch("/user", token.access_token); if (String(user.id) !== String(env.OWNER_GITHUB_ID)) return apiError("该账号不是 Life Git 所有者", 403, "owner_only"); const session = await makeSession(user.id, env.SESSION_SECRET);
    return new Response(null, { status: 302, headers: { location: "/admin/projects", "set-cookie": `life_git_session=${encodeURIComponent(session)}; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/` } });
  }
  return null;
}

async function publicApi(request, env, url) {
  const db = getDb(env);
  if (url.pathname === "/api/public/profile") {
    const readme = await db.prepare("SELECT * FROM profile_readme_versions WHERE status = 'published' ORDER BY published_at DESC LIMIT 1").first(); const commits = await db.prepare("SELECT * FROM life_commits ORDER BY date DESC, created_at DESC LIMIT 20").all(); return json({ readme: readme ? mapReadmeVersion(readme) : null, commits: (commits.results || []).map(mapLifeCommit) });
  }
  if (url.pathname === "/api/public/projects") return json({ projects: await loadProjects(db, false) });
  const match = url.pathname.match(/^\/api\/public\/projects\/([^/]+)\/(tree|file)$/);
  if (match) {
    const project = await db.prepare("SELECT * FROM projects WHERE slug = ? AND visibility = 'public' AND deleted_at IS NULL").bind(decodeURIComponent(match[1])).first(); if (!project) return apiError("项目不存在", 404, "not_found");
    if (match[2] === "tree") { const files = await db.prepare("SELECT path, kind, language, size, sha, visibility FROM project_files WHERE project_id = ? AND visibility = 'public' ORDER BY path LIMIT 5000").bind(project.id).all(); return json({ project, files: files.results || [] }); }
    return serveProjectFile(request, env, project, url.searchParams.get("path"), false);
  }
  return null;
}

async function serveProjectFile(request, env, project, rawPath, owner) {
  const path = normalizePath(rawPath); if (!isSafePath(path)) return apiError("文件路径不安全", 400, "unsafe_path"); const db = getDb(env); const file = await db.prepare(`SELECT * FROM project_files WHERE project_id = ? AND path = ? ${owner ? "" : "AND visibility = 'public'"}`).bind(project.id, path).first(); if (!file) return apiError("文件不存在", 404, "not_found"); if (["blocked", "binary"].includes(file.kind)) return apiError("该文件不支持预览", 415, "preview_blocked");
  let object = file.storage_key && env.FILES ? await getFiles(env).get(file.storage_key) : null;
  if (!object && file.remote_url) { const token = await installationToken(env, project.installation_id); const response = await fetch(file.remote_url, { headers: token ? { authorization: `Bearer ${token}` } : {} }); if (!response.ok) return apiError("无法读取 GitHub 文件", 502, "github_read_failed"); const body = await response.arrayBuffer(); if (body.byteLength > (file.kind === "image" ? 20 : 2) * 1024 * 1024) return apiError("文件超过预览限制", 413, "preview_too_large"); const key = `projects/${project.id}/${file.sha}/${path}`; if (env.FILES) { await getFiles(env).put(key, body, { httpMetadata: { contentType: file.kind === "image" ? response.headers.get("content-type") || "application/octet-stream" : "text/plain; charset=utf-8" } }); await db.prepare("UPDATE project_files SET storage_key = ?, updated_at = ? WHERE id = ?").bind(key, now(), file.id).run(); } return new Response(body, { headers: { "content-type": file.kind === "image" ? response.headers.get("content-type") || "application/octet-stream" : "text/plain; charset=utf-8", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; style-src 'none'; sandbox" } }); }
  if (!object) return apiError("文件内容尚未同步", 404, "content_not_cached"); const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("x-content-type-options", "nosniff"); headers.set("content-security-policy", "default-src 'none'; style-src 'none'; sandbox"); return new Response(object.body, { headers });
}

async function generateReadme(env, force = false) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED"); const db = getDb(env); const projectsResult = await db.prepare("SELECT id, slug, name, description, technologies, updated_at FROM projects WHERE visibility = 'public' AND deleted_at IS NULL ORDER BY updated_at DESC").all(); const commitsResult = await db.prepare("SELECT id, title, description, type, date, tags FROM life_commits ORDER BY date DESC, created_at DESC LIMIT 30").all(); const filesResult = await db.prepare("SELECT project_id, path, language, sha FROM project_files WHERE visibility = 'public' AND kind IN ('code','markdown') ORDER BY project_id, path LIMIT 500").all(); const evidence = { projects: projectsResult.results || [], recentCommits: commitsResult.results || [], publicFiles: filesResult.results || [] }; const fingerprint = await hmac(JSON.stringify(evidence), env.SESSION_SECRET || "life-git");
  if (!force) { const existing = await db.prepare("SELECT * FROM profile_readme_versions WHERE source_fingerprint = ? AND status IN ('draft','published') ORDER BY created_at DESC LIMIT 1").bind(fingerprint).first(); if (existing) return { version: mapReadmeVersion(existing), unchanged: true }; }
  const jobId = makeId("ai"); await db.prepare("INSERT INTO ai_jobs (id, kind, status, input_fingerprint, created_at, updated_at) VALUES (?, 'profile_readme', 'running', ?, ?, ?)").bind(jobId, fingerprint, now(), now()).run();
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-5.6", store: false, input: [{ role: "developer", content: [{ type: "input_text", text: "你只能根据提供的证据撰写 Tulip 的简体中文自我介绍。禁止编造经历、技能、数据或成果。返回 Markdown 与实际使用的 source_refs。" }] }, { role: "user", content: [{ type: "input_text", text: JSON.stringify(evidence) }] }], text: { format: { type: "json_schema", name: "life_git_profile_readme", strict: true, schema: { type: "object", additionalProperties: false, required: ["markdown", "source_refs"], properties: { markdown: { type: "string" }, source_refs: { type: "array", items: { type: "string" } } } } } } }) });
  if (!response.ok) { await db.prepare("UPDATE ai_jobs SET status='failed', error=?, updated_at=? WHERE id=?").bind(`OPENAI_${response.status}`, now(), jobId).run(); throw new Error(`OPENAI_${response.status}`); }
  const payload = await response.json(); const raw = payload.output_text || payload.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text; const result = JSON.parse(raw); const latest = await db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM profile_readme_versions").first(); const id = makeId("readme"); const createdAt = now(); await db.prepare("INSERT INTO profile_readme_versions (id, version, status, markdown, source_refs, source_fingerprint, generation_mode, model, created_at) VALUES (?, ?, 'draft', ?, ?, ?, 'ai', ?, ?)").bind(id, Number(latest?.version || 0) + 1, result.markdown, JSON.stringify(result.source_refs), fingerprint, payload.model || env.OPENAI_MODEL || "gpt-5.6", createdAt).run(); await db.prepare("UPDATE ai_jobs SET status='completed', output_id=?, updated_at=? WHERE id=?").bind(id, now(), jobId).run(); return { version: { id, version: Number(latest?.version || 0) + 1, status: "draft", markdown: result.markdown, sourceRefs: result.source_refs, sourceFingerprint: fingerprint, generationMode: "ai", createdAt }, unchanged: false };
}
function mapReadmeVersion(row) { return { id: row.id, version: row.version, status: row.status, markdown: row.markdown, sourceRefs: JSON.parse(row.source_refs || "[]"), sourceFingerprint: row.source_fingerprint, generationMode: row.generation_mode, createdAt: row.created_at, publishedAt: row.published_at }; }
function parseJsonArray(value) { try { const result = JSON.parse(value || "[]"); return Array.isArray(result) ? result : []; } catch { return []; } }
function mapLifeCommit(row) { return { id: row.id, title: row.title, description: row.description, rawContent: row.raw_content, type: row.type, date: row.date, tags: parseJsonArray(row.tags), enrichment: row.enrichment ? JSON.parse(row.enrichment) : null, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapProjectFile(row, project, owner) {
  const base = owner ? `/api/projects/${encodeURIComponent(project.id)}/file` : `/api/public/projects/${encodeURIComponent(project.slug)}/file`;
  const fileUrl = `${base}?path=${encodeURIComponent(row.path)}`;
  return { id: row.id, path: row.path, kind: row.kind, language: row.language || "Text", size: row.size || 0, sha: row.sha, visibility: row.visibility, blockedReason: row.blocked_reason || undefined, remoteUrl: ["code", "markdown"].includes(row.kind) ? fileUrl : undefined, previewUrl: row.kind === "image" ? fileUrl : undefined };
}
function mapProject(row, files = [], owner = false) {
  const mappedFiles = files.map((file) => mapProjectFile(file, row, owner));
  return { id: row.id, slug: row.slug, name: row.name, description: row.description, sourceType: row.source_type, githubUrl: row.github_url || "", repoFullName: row.repo_full_name || "", defaultBranch: row.default_branch || "main", headSha: row.head_sha || "pending", visibility: row.visibility, syncStatus: row.sync_status, lastSyncedAt: row.last_synced_at || row.updated_at, technologies: parseJsonArray(row.technologies), readme: `# ${row.name}\n\n${row.description || "项目 README 尚未同步。"}`, files: mappedFiles };
}
async function loadProjects(db, owner) {
  const where = owner ? "deleted_at IS NULL" : "visibility = 'public' AND deleted_at IS NULL";
  const projects = (await db.prepare(`SELECT * FROM projects WHERE ${where} ORDER BY updated_at DESC`).all()).results || [];
  if (!projects.length) return [];
  const files = (await db.prepare(`SELECT * FROM project_files WHERE project_id IN (${projects.map(() => "?").join(",")}) ${owner ? "" : "AND visibility = 'public'"} ORDER BY path LIMIT 5000`).bind(...projects.map((project) => project.id)).all()).results || [];
  const byProject = new Map(); for (const file of files) { const list = byProject.get(file.project_id) || []; list.push(file); byProject.set(file.project_id, list); }
  return projects.map((project) => mapProject(project, byProject.get(project.id) || [], owner));
}

async function ownerApi(request, env, url, ctx) {
  const known = url.pathname === "/api/session" || url.pathname === "/api/projects" || url.pathname === "/api/github/install" || url.pathname === "/api/github/setup" || url.pathname === "/api/projects/import" || url.pathname === "/api/migrate/local" || url.pathname === "/api/profile/readme/generate" || url.pathname === "/api/profile/readme/versions" || /^\/api\/projects\/[^/]+$/.test(url.pathname) || /^\/api\/projects\/[^/]+\/(sync|tree|file|files|uploads)$/.test(url.pathname) || /^\/api\/profile\/readme\/versions\/[^/]+(?:\/(?:publish|restore))?$/.test(url.pathname);
  if (!known) return null;
  if (url.pathname === "/api/session") return json({ owner: await isOwner(request, env), githubConfigured: Boolean(env.GITHUB_APP_ID), aiConfigured: Boolean(env.OPENAI_API_KEY) });
  const auth = await requireOwner(request, env); if (auth) return auth; const db = getDb(env);
  if (url.pathname === "/api/projects" && request.method === "GET") return json({ projects: await loadProjects(db, true) });
  if (url.pathname === "/api/profile/readme/versions" && request.method === "GET") { const versions = await db.prepare("SELECT * FROM profile_readme_versions ORDER BY version DESC").all(); return json({ versions: (versions.results || []).map(mapReadmeVersion) }); }
  if (url.pathname === "/api/github/install" && request.method === "POST") { if (!env.GITHUB_APP_SLUG) return apiError("GitHub App 尚未配置", 503, "service_not_configured"); return json({ url: `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new` }); }
  if (url.pathname === "/api/github/setup" && request.method === "GET") { const installationId = url.searchParams.get("installation_id"); if (!installationId) return apiError("缺少 GitHub App installation_id"); const token = await installationToken(env, installationId); const installation = await githubFetch(`/app/installations/${installationId}`, await githubAppJwt(env)); await db.prepare("INSERT INTO github_installations (id, account_id, account_login, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id, account_login=excluded.account_login, status='active', updated_at=excluded.updated_at").bind(String(installationId), String(installation.account?.id || ""), installation.account?.login || "", now(), now()).run(); await githubFetch("/installation/repositories?per_page=1", token); return new Response(null, { status: 302, headers: { location: `/admin/projects?installation=${encodeURIComponent(installationId)}` } }); }
  if (url.pathname === "/api/projects/import" && request.method === "POST") {
    const body = await readJson(request); const parsed = parseGithubUrl(body.githubUrl); if (!parsed) return apiError("请输入有效的 GitHub 仓库地址"); const token = await installationToken(env, body.installationId); const repository = await githubFetch(`/repos/${parsed.owner}/${parsed.repo}`, token); const id = makeId("project"); const timestamp = now(); const project = { id, slug: slugify(repository.name), name: repository.name, description: repository.description || "", source_type: "github", github_url: repository.html_url, repo_full_name: repository.full_name, repository_id: String(repository.id), installation_id: body.installationId ? String(body.installationId) : null, default_branch: repository.default_branch, head_sha: "pending", visibility: body.visibility === "public" ? "public" : "private", sync_status: "syncing", technologies: JSON.stringify(repository.language ? [repository.language] : []), created_at: timestamp, updated_at: timestamp };
    await db.prepare("INSERT INTO projects (id, slug, name, description, source_type, github_url, repo_full_name, repository_id, installation_id, default_branch, head_sha, visibility, sync_status, technologies, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...[project.id, project.slug, project.name, project.description, project.source_type, project.github_url, project.repo_full_name, project.repository_id, project.installation_id, project.default_branch, project.head_sha, project.visibility, project.sync_status, project.technologies, project.created_at, project.updated_at]).run(); await upsertProjectTree(env, project, token); const stored = await db.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first(); const files = await db.prepare("SELECT * FROM project_files WHERE project_id = ? ORDER BY path LIMIT 5000").bind(id).all(); return json({ project: mapProject(stored, files.results || [], true) }, 201);
  }
  const projectUpdateMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectUpdateMatch && request.method === "PATCH") { const body = await readJson(request); if (!['public', 'private'].includes(body.visibility)) return apiError("项目可见性无效"); const result = await db.prepare("UPDATE projects SET visibility=?, updated_at=? WHERE id=? AND deleted_at IS NULL").bind(body.visibility, now(), projectUpdateMatch[1]).run(); if (!result.meta?.changes) return apiError("项目不存在", 404, "not_found"); await db.prepare("INSERT INTO audit_logs (id, action, target_type, target_id, metadata, created_at) VALUES (?, 'project.visibility', 'project', ?, ?, ?)").bind(makeId("audit"), projectUpdateMatch[1], JSON.stringify({ visibility: body.visibility }), now()).run(); return json({ ok: true, visibility: body.visibility }); }
  const fileUpdateMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/files$/);
  if (fileUpdateMatch && request.method === "PATCH") { const body = await readJson(request); const path = normalizePath(body.path); if (!isSafePath(path) || !['public', 'private'].includes(body.visibility)) return apiError("文件可见性或路径无效"); const result = await db.prepare("UPDATE project_files SET visibility=?, updated_at=? WHERE project_id=? AND path=?").bind(body.visibility, now(), fileUpdateMatch[1], path).run(); if (!result.meta?.changes) return apiError("文件不存在", 404, "not_found"); await db.prepare("INSERT INTO audit_logs (id, action, target_type, target_id, metadata, created_at) VALUES (?, 'file.visibility', 'project_file', ?, ?, ?)").bind(makeId("audit"), `${fileUpdateMatch[1]}:${path}`, JSON.stringify({ visibility: body.visibility }), now()).run(); return json({ ok: true, path, visibility: body.visibility }); }
  const syncMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/sync$/);
  if (syncMatch && request.method === "POST") { const project = await db.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").bind(syncMatch[1]).first(); if (!project) return apiError("项目不存在", 404, "not_found"); const jobId = makeId("sync"); await db.prepare("INSERT INTO sync_jobs (id, project_id, status, trigger, created_at, updated_at) VALUES (?, ?, 'running', 'manual', ?, ?)").bind(jobId, project.id, now(), now()).run(); try { const result = await upsertProjectTree(env, project, await installationToken(env, project.installation_id)); await db.prepare("UPDATE sync_jobs SET status='completed', result_json=?, updated_at=? WHERE id=?").bind(JSON.stringify(result), now(), jobId).run(); return json({ jobId, result }); } catch (error) { await db.prepare("UPDATE sync_jobs SET status='failed', error=?, updated_at=? WHERE id=?").bind(error.message, now(), jobId).run(); throw error; } }
  const treeMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/tree$/);
  if (treeMatch && request.method === "GET") { const project = await db.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").bind(treeMatch[1]).first(); if (!project) return apiError("项目不存在", 404, "not_found"); const files = await db.prepare("SELECT * FROM project_files WHERE project_id = ? ORDER BY path LIMIT 5000").bind(project.id).all(); return json({ project, files: files.results || [] }); }
  const fileMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/file$/);
  if (fileMatch && request.method === "GET") { const project = await db.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").bind(fileMatch[1]).first(); if (!project) return apiError("项目不存在", 404, "not_found"); return serveProjectFile(request, env, project, url.searchParams.get("path"), true); }
  const uploadMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/uploads$/);
  if (uploadMatch && request.method === "POST") { const project = await db.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").bind(uploadMatch[1]).first(); if (!project) return apiError("项目不存在", 404, "not_found"); const body = await readJson(request); const path = normalizePath(body.path); const kind = classifyPath(path, body.contentType || ""); if (!isSafePath(path) || kind === "blocked") return apiError("敏感或不安全的文件路径", 400, "unsafe_path"); const bytes = body.encoding === "base64" ? Uint8Array.from(atob(body.content || ""), (char) => char.charCodeAt(0)) : new TextEncoder().encode(body.content || ""); const max = kind === "image" ? 20 * 1024 * 1024 : 2 * 1024 * 1024; if (bytes.byteLength > max) return apiError("文件超过上传限制", 413, "file_too_large"); const id = makeId("file"); const sha = await hmac(`${path}:${bytes.byteLength}:${Date.now()}`, env.SESSION_SECRET || "upload"); const storageKey = `projects/${project.id}/uploads/${sha}/${path}`; await getFiles(env).put(storageKey, bytes, { httpMetadata: { contentType: body.contentType || (kind === "image" ? "application/octet-stream" : "text/plain; charset=utf-8") } }); await db.prepare("INSERT INTO project_files (id, project_id, path, kind, language, size, sha, storage_key, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?) ON CONFLICT(project_id,path) DO UPDATE SET kind=excluded.kind, language=excluded.language, size=excluded.size, sha=excluded.sha, storage_key=excluded.storage_key, visibility='private', updated_at=excluded.updated_at").bind(id, project.id, path, kind, languageForPath(path), bytes.byteLength, sha, storageKey, now(), now()).run(); return json({ file: { id, path, kind, size: bytes.byteLength, sha, visibility: "private" } }, 201); }
  if (url.pathname === "/api/migrate/local" && request.method === "POST") {
    const body = await readJson(request); const timestamp = now(); const commits = Array.isArray(body.commits) ? body.commits.slice(0, 5000) : []; const projects = Array.isArray(body.projects) ? body.projects.slice(0, 100) : []; const versions = Array.isArray(body.readmeState?.versions) ? body.readmeState.versions.slice(0, 100) : [];
    const commitStatements = commits.map((commit) => db.prepare("INSERT INTO life_commits (id, title, description, raw_content, type, date, tags, enrichment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description, raw_content=excluded.raw_content, type=excluded.type, date=excluded.date, tags=excluded.tags, enrichment=excluded.enrichment, updated_at=excluded.updated_at").bind(commit.id, commit.title, commit.description || commit.rawContent || "", commit.rawContent || commit.description || "", commit.type, commit.date, JSON.stringify(commit.tags || []), JSON.stringify(commit.enrichment || null), commit.createdAt || timestamp, commit.updatedAt || timestamp)); for (let index = 0; index < commitStatements.length; index += 75) await db.batch(commitStatements.slice(index, index + 75));
    for (const project of projects) { const projectId = String(project.id || makeId("project")); await db.prepare("INSERT INTO projects (id, slug, name, description, source_type, github_url, repo_full_name, default_branch, head_sha, visibility, sync_status, technologies, last_synced_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, name=excluded.name, description=excluded.description, github_url=excluded.github_url, repo_full_name=excluded.repo_full_name, default_branch=excluded.default_branch, head_sha=excluded.head_sha, visibility=excluded.visibility, sync_status=excluded.sync_status, technologies=excluded.technologies, last_synced_at=excluded.last_synced_at, updated_at=excluded.updated_at").bind(projectId, project.slug || slugify(project.name || projectId), project.name || "Untitled", project.description || "", project.sourceType === "github" ? "github" : "upload", project.githubUrl || null, project.repoFullName || null, project.defaultBranch || "main", project.headSha || "migrated", project.visibility === "public" ? "public" : "private", ["local", "syncing", "synced", "failed"].includes(project.syncStatus) ? project.syncStatus : "local", JSON.stringify(project.technologies || []), project.lastSyncedAt || timestamp, timestamp, timestamp).run();
      for (const file of (Array.isArray(project.files) ? project.files.slice(0, 5000) : [])) { const path = normalizePath(file.path); const kind = classifyPath(path); if (!isSafePath(path) || kind === "blocked") continue; let storageKey = null; let bytes = null; let contentType = kind === "image" ? "application/octet-stream" : "text/plain; charset=utf-8"; if (typeof file.content === "string") bytes = new TextEncoder().encode(file.content); else if (kind === "image" && typeof file.previewUrl === "string" && file.previewUrl.startsWith("data:")) { const comma = file.previewUrl.indexOf(","); contentType = file.previewUrl.slice(5, file.previewUrl.indexOf(";")); bytes = Uint8Array.from(atob(file.previewUrl.slice(comma + 1)), (char) => char.charCodeAt(0)); } if (bytes) { const max = kind === "image" ? 20 * 1024 * 1024 : 2 * 1024 * 1024; if (bytes.byteLength <= max && env.FILES) { storageKey = `projects/${projectId}/migration/${file.sha || makeId("file")}/${path}`; await getFiles(env).put(storageKey, bytes, { httpMetadata: { contentType } }); } } await db.prepare("INSERT INTO project_files (id, project_id, path, kind, language, size, sha, storage_key, remote_url, visibility, blocked_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(project_id,path) DO UPDATE SET kind=excluded.kind, language=excluded.language, size=excluded.size, sha=excluded.sha, storage_key=COALESCE(excluded.storage_key, project_files.storage_key), remote_url=excluded.remote_url, visibility=excluded.visibility, blocked_reason=excluded.blocked_reason, updated_at=excluded.updated_at").bind(makeId("file"), projectId, path, kind, file.language || languageForPath(path), file.size || bytes?.byteLength || 0, file.sha || makeId("sha"), storageKey, file.remoteUrl?.startsWith("http") ? file.remoteUrl : null, file.visibility === "public" ? "public" : "private", file.blockedReason || null, timestamp, timestamp).run(); }
    }
    for (const version of versions) await db.prepare("INSERT INTO profile_readme_versions (id, version, status, markdown, source_refs, source_fingerprint, generation_mode, created_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status=excluded.status, markdown=excluded.markdown, source_refs=excluded.source_refs, source_fingerprint=excluded.source_fingerprint, generation_mode=excluded.generation_mode, published_at=excluded.published_at").bind(version.id || makeId("readme"), Number(version.version || 1), ["draft", "published", "superseded"].includes(version.status) ? version.status : "draft", version.markdown || "# Tulip", JSON.stringify(version.sourceRefs || []), version.sourceFingerprint || null, version.generationMode || "migration", version.createdAt || timestamp, version.publishedAt || null).run();
    await db.prepare("INSERT INTO audit_logs (id, action, target_type, target_id, metadata, created_at) VALUES (?, 'demo.migrate', 'account', 'tulip', ?, ?)").bind(makeId("audit"), JSON.stringify({ commits: commits.length, projects: projects.length, readmeVersions: versions.length }), timestamp).run(); return json({ commits: commits.length, projects: projects.length, readmeVersions: versions.length });
  }
  if (url.pathname === "/api/profile/readme/generate" && request.method === "POST") { const body = await readJson(request); return json(await generateReadme(env, Boolean(body.force)), 201); }
  const readmeVersionMatch = url.pathname.match(/^\/api\/profile\/readme\/versions\/([^/]+)$/);
  if (readmeVersionMatch && request.method === "PATCH") { const body = await readJson(request); const markdown = String(body.markdown || "").trim(); if (!markdown || markdown.length > 200000) return apiError("README 内容为空或过长"); const result = await db.prepare("UPDATE profile_readme_versions SET markdown=? WHERE id=? AND status='draft'").bind(markdown, readmeVersionMatch[1]).run(); if (!result.meta?.changes) return apiError("只能编辑草稿版本", 409, "not_draft"); return json({ ok: true }); }
  if (readmeVersionMatch && request.method === "DELETE") { const result = await db.prepare("DELETE FROM profile_readme_versions WHERE id=? AND status='draft'").bind(readmeVersionMatch[1]).run(); if (!result.meta?.changes) return apiError("只能拒绝草稿版本", 409, "not_draft"); return json({ ok: true }); }
  const restoreMatch = url.pathname.match(/^\/api\/profile\/readme\/versions\/([^/]+)\/restore$/);
  if (restoreMatch && request.method === "POST") { const source = await db.prepare("SELECT * FROM profile_readme_versions WHERE id=?").bind(restoreMatch[1]).first(); if (!source) return apiError("README 版本不存在", 404, "not_found"); const latest = await db.prepare("SELECT COALESCE(MAX(version),0) AS version FROM profile_readme_versions").first(); const restored = { ...source, id: makeId("readme"), version: Number(latest?.version || 0) + 1, status: "draft", generation_mode: "rollback", created_at: now(), published_at: null }; await db.prepare("INSERT INTO profile_readme_versions (id, version, status, markdown, source_refs, source_fingerprint, generation_mode, model, created_at) VALUES (?, ?, 'draft', ?, ?, ?, 'rollback', ?, ?)").bind(restored.id, restored.version, restored.markdown, restored.source_refs, restored.source_fingerprint, restored.model, restored.created_at).run(); return json({ version: mapReadmeVersion(restored) }, 201); }
  const publishMatch = url.pathname.match(/^\/api\/profile\/readme\/versions\/([^/]+)\/publish$/);
  if (publishMatch && request.method === "POST") { const version = await db.prepare("SELECT * FROM profile_readme_versions WHERE id = ?").bind(publishMatch[1]).first(); if (!version) return apiError("README 版本不存在", 404, "not_found"); const timestamp = now(); await db.batch([db.prepare("UPDATE profile_readme_versions SET status='superseded' WHERE status='published'"), db.prepare("UPDATE profile_readme_versions SET status='published', published_at=? WHERE id=?").bind(timestamp, version.id)]); return json({ version: { ...mapReadmeVersion(version), status: "published", publishedAt: timestamp } }); }
  return null;
}

async function verifyGithubWebhook(request, env, rawBody) {
  if (!env.GITHUB_WEBHOOK_SECRET) return false; const signature = request.headers.get("x-hub-signature-256") || ""; const expected = `sha256=${(await hmac(rawBody, env.GITHUB_WEBHOOK_SECRET)).replace(/-/g, "+").replace(/_/g, "/")}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.GITHUB_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const hex = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody))), (byte) => byte.toString(16).padStart(2, "0")).join(""); return timingSafeEqual(signature, `sha256=${hex}`) || timingSafeEqual(signature, expected);
}
async function handleWebhook(request, env, ctx) {
  const raw = await request.text(); if (!await verifyGithubWebhook(request, env, raw)) return apiError("Webhook 签名无效", 401, "invalid_signature"); const delivery = request.headers.get("x-github-delivery") || makeId("delivery"); const db = getDb(env); const existing = await db.prepare("SELECT id FROM webhook_deliveries WHERE id = ?").bind(delivery).first(); if (existing) return json({ ok: true, duplicate: true }); await db.prepare("INSERT INTO webhook_deliveries (id, event, received_at) VALUES (?, ?, ?)").bind(delivery, request.headers.get("x-github-event") || "unknown", now()).run(); const payload = JSON.parse(raw); if (request.headers.get("x-github-event") === "push" && payload.repository?.id) { const project = await db.prepare("SELECT * FROM projects WHERE repository_id = ? AND deleted_at IS NULL").bind(String(payload.repository.id)).first(); if (project) ctx.waitUntil(upsertProjectTree(env, project, installationToken(env, project.installation_id)).catch(async (error) => { await db.prepare("UPDATE projects SET sync_status='failed', updated_at=? WHERE id=?").bind(now(), project.id).run(); console.error(error); })); } return json({ ok: true });
}

export default {
  async fetch(request, env, ctx = { waitUntil() {} }) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/auth/github/")) { const auth = await handleGithubAuth(request, env, url); if (auth) return auth; }
      if (url.pathname === "/api/github/webhook" && request.method === "POST") return handleWebhook(request, env, ctx);
      if (url.pathname.startsWith("/api/public/")) { const response = await publicApi(request, env, url); if (response) return response; }
      if (url.pathname.startsWith("/api/")) { const response = await ownerApi(request, env, url, ctx); return response || apiError("接口不存在", 404, "not_found"); }
    } catch (error) {
      const known = { D1_NOT_CONFIGURED: [503, "D1 数据库尚未绑定"], R2_NOT_CONFIGURED: [503, "R2 文件存储尚未绑定"], OPENAI_NOT_CONFIGURED: [503, "AI 服务尚未配置"], GITHUB_APP_NOT_CONFIGURED: [503, "GitHub App 尚未配置"], JSON_REQUIRED: [415, "请使用 JSON 请求"] }; const mapped = known[error.message]; console.error(error); return apiError(mapped?.[1] || "服务处理失败", mapped?.[0] || 500, mapped ? "service_not_configured" : "internal_error");
    }
    const response = await env.ASSETS.fetch(request); const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) return response;
    const indexUrl = new URL(request.url); indexUrl.pathname = "/index.html"; indexUrl.search = ""; return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
