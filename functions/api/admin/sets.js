import { jsonRes, verifyAuth } from "./_auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!(await verifyAuth(request, env))) {
    return jsonRes({ error: "Unauthorized" }, 401);
  }

  try {
    const db = env.ALEREGO_META;
    if (!db) {
      return jsonRes({ error: "ALEREGO_META KV binding not configured in Cloudflare Pages settings" }, 500);
    }

    let storedSets = await db.get("galleries_metadata", "json");
    if (!storedSets || !storedSets.length) {
      storedSets = [];
    }

    return jsonRes({ sets: storedSets });
  } catch (e) {
    return jsonRes({ error: e.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await verifyAuth(request, env))) {
    return jsonRes({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json();
    const db = env.ALEREGO_META;
    if (!db) {
      return jsonRes({ error: "ALEREGO_META KV binding not configured in Cloudflare Pages settings" }, 500);
    }

    await db.put("galleries_metadata", JSON.stringify(body.sets));
    return jsonRes({ success: true, message: "Modifiche salvate con successo!" });
  } catch (e) {
    return jsonRes({ error: e.message }, 500);
  }
}
