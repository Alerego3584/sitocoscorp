const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const AUTH_WINDOW_MS = 1000 * 60 * 10;
const AUTH_MAX_ATTEMPTS = 5;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const UPLOAD_PATH = /^(cosplay|corporate)\/featured\/[a-zA-Z0-9._-]+\/(full|thumbnails)\/[a-zA-Z0-9._-]+$/;
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const authAttempts = new Map();

export function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function encoder() {
  return new TextEncoder();
}

function bytesToB64Url(bytes) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToBytes(str) {
  const pad = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8ToB64Url(text) {
  return bytesToB64Url(encoder().encode(text));
}

function b64UrlToUtf8(str) {
  return new TextDecoder().decode(b64UrlToBytes(str));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(secret) {
  const iat = Date.now();
  const payload = utf8ToB64Url(JSON.stringify({ iat, exp: iat + TOKEN_TTL_MS }));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder().encode(payload));
  return `${payload}.${bytesToB64Url(new Uint8Array(sig))}`;
}

function timingEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return false;

  const secret = env.JWT_SECRET;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  try {
    const key = await hmacKey(secret);
    const expected = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder().encode(payloadB64))
    );
    if (!timingEqual(expected, b64UrlToBytes(sigB64))) return false;
    const payload = JSON.parse(b64UrlToUtf8(payloadB64));
    if (!payload.exp || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() ||
    "unknown"
  );
}

export function consumeAuthAttempt(ip) {
  const now = Date.now();
  const row = authAttempts.get(ip);
  if (!row || now > row.reset) {
    authAttempts.set(ip, { count: 1, reset: now + AUTH_WINDOW_MS });
    return { ok: true };
  }
  row.count += 1;
  if (row.count > AUTH_MAX_ATTEMPTS) {
    return { ok: false, retryAfter: Math.ceil((row.reset - now) / 1000) };
  }
  return { ok: true };
}

export function isAllowedUploadPath(objectPath) {
  return typeof objectPath === "string" && UPLOAD_PATH.test(objectPath);
}

export function isAllowedUpload(file) {
  if (!file) return { ok: false, error: "Missing file or path" };
  const type = String(file.type || "").toLowerCase();
  if (type && !ALLOWED_MIME.has(type)) {
    return { ok: false, error: "Only JPEG, PNG, or WEBP uploads are allowed" };
  }
  if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File too large (max 12 MB)" };
  }
  return { ok: true };
}
