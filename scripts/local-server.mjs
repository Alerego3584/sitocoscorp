// Local Pages-shaped server for Alerego
// GET  /api/public/sets     -> KV key galleries_metadata
// GET  /media/{key}         -> R2 object key
// POST /api/admin/auth
// GET  /api/admin/sets
// POST /api/admin/sets
// POST /api/admin/upload
// Files live in local-data/  (swap in a production dump anytime)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const META_FILE = path.join(ROOT, "local-data", "galleries_metadata.json");
const R2_ROOT = path.join(ROOT, "local-data", "r2");
const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Pop123456";
const JWT_SECRET = process.env.JWT_SECRET || "secret-fallback-key-do-not-use-in-prod";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const AUTH_WINDOW_MS = 1000 * 60 * 10;
const AUTH_MAX_ATTEMPTS = 5;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const UPLOAD_PATH = /^(cosplay|corporate)\/featured\/[a-zA-Z0-9._-]+\/(full|thumbnails)\/[a-zA-Z0-9._-]+$/;
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const authAttempts = new Map();

function signToken(secret) {
  const iat = Date.now();
  const payload = Buffer.from(JSON.stringify({ iat, exp: iat + TOKEN_TTL_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyAuth(request) {
  const authHeader = request.headers.authorization || "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const [payloadB64, sig] = parts;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(payloadB64).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    return Boolean(payload.exp && Date.now() <= payload.exp);
  } catch {
    return false;
  }
}

function consumeAuthAttempt(ip) {
  const now = Date.now();
  const row = authAttempts.get(ip);
  if (!row || now > row.reset) {
    authAttempts.set(ip, { count: 1, reset: now + AUTH_WINDOW_MS });
    return true;
  }
  row.count += 1;
  return row.count <= AUTH_MAX_ATTEMPTS;
}

function isAllowedUploadPath(objectPath) {
  return typeof objectPath === "string" && UPLOAD_PATH.test(objectPath);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function readMeta() {
  if (!fs.existsSync(META_FILE)) {
    return { sets: [] };
  }
  const raw = fs.readFileSync(META_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return { sets: parsed };
  if (parsed && Array.isArray(parsed.sets)) return parsed;
  return { sets: [] };
}

function writeMeta(sets) {
  fs.mkdirSync(path.dirname(META_FILE), { recursive: true });
  fs.writeFileSync(META_FILE, `${JSON.stringify({ sets }, null, 2)}\n`, "utf8");
}

function resolveStatic(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const safe = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(ROOT, safe);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    if (fs.existsSync(htmlPath)) filePath = htmlPath;
  }

  return filePath;
}

function seedR2IfNeeded() {
  const copies = [
    ["images/hero/subject.jpg", "cosplay/featured/studio-lights/full/cover-01.jpg"],
    ["images/hero/subject.jpg", "cosplay/featured/studio-lights/thumbnails/cover-01.jpg"],
    ["images/hero/plate.jpg", "cosplay/featured/studio-lights/full/cover-02.jpg"],
    ["images/hero/plate.jpg", "cosplay/featured/studio-lights/thumbnails/cover-02.jpg"],
    ["images/hero/corporate.jpg", "cosplay/featured/studio-lights/full/cover-03.jpg"],
    ["images/hero/corporate.jpg", "cosplay/featured/studio-lights/thumbnails/cover-03.jpg"],
    ["images/hero/plate.jpg", "cosplay/featured/set-atmosphere/full/cover-01.jpg"],
    ["images/hero/plate.jpg", "cosplay/featured/set-atmosphere/thumbnails/cover-01.jpg"],
    ["images/hero/subject.jpg", "cosplay/featured/set-atmosphere/full/cover-02.jpg"],
    ["images/hero/subject.jpg", "cosplay/featured/set-atmosphere/thumbnails/cover-02.jpg"],
    ["images/hero/corporate.jpg", "corporate/featured/leadership-frame/full/cover-01.jpg"],
    ["images/hero/corporate.jpg", "corporate/featured/leadership-frame/thumbnails/cover-01.jpg"],
    ["images/hero/plate.jpg", "corporate/featured/leadership-frame/full/cover-02.jpg"],
    ["images/hero/plate.jpg", "corporate/featured/leadership-frame/thumbnails/cover-02.jpg"],
    ["images/hero/subject.jpg", "corporate/featured/leadership-frame/full/cover-03.jpg"],
    ["images/hero/subject.jpg", "corporate/featured/leadership-frame/thumbnails/cover-03.jpg"],
    ["images/hero/plate.jpg", "corporate/featured/floor-day/full/cover-01.jpg"],
    ["images/hero/plate.jpg", "corporate/featured/floor-day/thumbnails/cover-01.jpg"],
    ["images/hero/corporate.jpg", "corporate/featured/floor-day/full/cover-02.jpg"],
    ["images/hero/corporate.jpg", "corporate/featured/floor-day/thumbnails/cover-02.jpg"],
  ];

  for (const [fromRel, toRel] of copies) {
    const from = path.join(ROOT, fromRel);
    const to = path.join(R2_ROOT, toRel);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (!fs.existsSync(to)) fs.copyFileSync(from, to);
  }
}

async function readBuffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function indexOfBuffer(haystack, needle, from = 0) {
  return haystack.indexOf(needle, from);
}

function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  const boundary = match?.[1] || match?.[2];
  if (!boundary) {
    throw new Error("Missing multipart boundary");
  }

  const delim = Buffer.from(`--${boundary}`);
  const headerSep = Buffer.from("\r\n\r\n");
  const fields = {};
  const files = {};
  let cursor = indexOfBuffer(buffer, delim);

  while (cursor !== -1) {
    let start = cursor + delim.length;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;

    const next = indexOfBuffer(buffer, delim, start);
    if (next === -1) break;

    let part = buffer.subarray(start, next);
    if (part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10) {
      part = part.subarray(0, part.length - 2);
    }

    const splitAt = indexOfBuffer(part, headerSep);
    if (splitAt < 0) {
      cursor = next;
      continue;
    }

    const header = part.subarray(0, splitAt).toString("utf8");
    const body = part.subarray(splitAt + 4);
    const name = /name="([^"]+)"/.exec(header)?.[1];
    const filename = /filename="([^"]*)"/.exec(header)?.[1];
    if (!name) {
      cursor = next;
      continue;
    }

    if (filename) {
      files[name] = {
        filename,
        type: /Content-Type:\s*([^\r\n]+)/i.exec(header)?.[1] || "application/octet-stream",
        data: Buffer.from(body),
      };
    } else {
      fields[name] = body.toString("utf8");
    }

    cursor = next;
  }

  return { fields, files };
}

function safeR2Path(key) {
  const root = path.resolve(R2_ROOT);
  const dest = path.resolve(root, key);
  if (dest !== root && !dest.startsWith(root + path.sep)) return null;
  return dest;
}

seedR2IfNeeded();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname === "/api/public/collaborators" && req.method === "GET") {
    try {
      const dir = path.join(ROOT, "images", "collaborators");
      if (!fs.existsSync(dir)) {
        sendJson(res, 200, { logos: [] });
        return;
      }
      const logos = fs.readdirSync(dir)
        .filter((name) => /\.(svg|png|webp|jpe?g)$/i.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
        .map((name) => `/images/collaborators/${name}`);
      sendJson(res, 200, { logos });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (pathname === "/api/public/sets" && req.method === "GET") {
    try {
      sendJson(res, 200, readMeta());
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (pathname === "/api/admin/auth" && req.method === "POST") {
    const ip = req.socket.remoteAddress || "unknown";
    if (!consumeAuthAttempt(ip)) {
      sendJson(res, 429, { error: "Too many attempts. Try again later." });
      return;
    }
    try {
      const body = JSON.parse((await readBuffer(req)).toString("utf8") || "{}");
      if (body.password !== ADMIN_PASSWORD) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const token = signToken(JWT_SECRET);
      sendJson(res, 200, { token, message: "Logged in successfully" });
    } catch {
      sendJson(res, 400, { error: "Bad request" });
    }
    return;
  }

  if (pathname === "/api/admin/sets" && req.method === "GET") {
    if (!verifyAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    sendJson(res, 200, readMeta());
    return;
  }

  if (pathname === "/api/admin/sets" && req.method === "POST") {
    if (!verifyAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      const body = JSON.parse((await readBuffer(req)).toString("utf8") || "{}");
      const sets = Array.isArray(body.sets) ? body.sets : [];
      writeMeta(sets);
      sendJson(res, 200, { success: true, message: "Saved to local-data/galleries_metadata.json" });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (pathname === "/api/admin/upload" && req.method === "POST") {
    if (!verifyAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      const buffer = await readBuffer(req);
      const { fields, files } = parseMultipart(buffer, req.headers["content-type"]);
      const key = fields.path;
      const file = files.file;
      if (!key || !file) {
        sendJson(res, 400, { error: "Missing file or path" });
        return;
      }
      if (!isAllowedUploadPath(key)) {
        sendJson(res, 400, { error: "Invalid upload path" });
        return;
      }
      const mime = String(file.type || "").toLowerCase();
      if (mime && !ALLOWED_MIME.has(mime)) {
        sendJson(res, 400, { error: "Only JPEG, PNG, or WEBP uploads are allowed" });
        return;
      }
      if (file.data.length > MAX_UPLOAD_BYTES) {
        sendJson(res, 400, { error: "File too large (max 12 MB)" });
        return;
      }
      const dest = safeR2Path(key);
      if (!dest) {
        sendJson(res, 400, { error: "Invalid path" });
        return;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, file.data);
      sendJson(res, 200, { success: true, path: key, publicUrl: `/media/${key}` });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (pathname.startsWith("/media/")) {
    const key = decodeURIComponent(pathname.slice("/media/".length));
    const filePath = safeR2Path(key);
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      send(res, 404, "Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, fs.readFileSync(filePath), {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=60",
    });
    return;
  }

  let filePath = resolveStatic(pathname);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(ROOT, "404.html");
    const body = fs.readFileSync(filePath);
    send(res, 404, body, { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  send(res, 200, fs.readFileSync(filePath), {
    "Content-Type": MIME[ext] || "application/octet-stream",
  });
});

server.listen(PORT, () => {
  process.stdout.write(`Alerego local (KV + R2 mock) http://localhost:${PORT}\n`);
  process.stdout.write(`Admin: http://localhost:${PORT}/admin  password: ${ADMIN_PASSWORD}\n`);
});
