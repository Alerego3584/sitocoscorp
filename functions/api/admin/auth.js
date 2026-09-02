import { jsonRes, signToken, consumeAuthAttempt, clientIp } from "./_auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const ip = clientIp(request);
  const limit = consumeAuthAttempt(ip);
  if (!limit.ok) {
    return jsonRes({ error: "Too many attempts. Try again later." }, 429);
  }

  try {
    const body = await request.json();
    const { password } = body;

    const validPassword = env.ADMIN_PASSWORD;
    if (!validPassword) {
      return jsonRes({ error: "ADMIN_PASSWORD not configured on Cloudflare Pages" }, 500);
    }

    if (password !== validPassword) {
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const secretKey = env.JWT_SECRET;
    if (!secretKey) {
      return jsonRes({ error: "JWT_SECRET not configured on Cloudflare Pages" }, 500);
    }

    const token = await signToken(secretKey);
    return jsonRes({ token, message: "Logged in successfully" });
  } catch {
    return jsonRes({ error: "Bad request" }, 400);
  }
}
