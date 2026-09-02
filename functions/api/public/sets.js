const jsonRes = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const db = env.ALEREGO_META;
    if (!db) {
      return jsonRes({ error: "ALEREGO_META non configurato" }, 500);
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
