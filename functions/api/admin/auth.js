// Helper per creare una semplice risposta JSON
const jsonRes = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
};

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { password } = body;

        // env.ADMIN_PASSWORD dovrà essere configurata nel pannello di Cloudflare Pages (Settings > Environment Variables)
        const validPassword = env.ADMIN_PASSWORD;

        if (!validPassword) {
            return jsonRes({ error: "Missing config: ADMIN_PASSWORD not set in Cloudflare dashboard." }, 500);
        }

        if (password !== validPassword) {
            return jsonRes({ error: "Unauthorized" }, 401);
        }

        // Per semplicità non usiamo una libreria complessa per JWT ma un hash HMAC fatto in casa (più leggero e zero-deps)
        const secretKey = env.JWT_SECRET || 'secret-fallback-key-do-not-use-in-prod';
        
        // Costruiamo un token finto semplice in questa prima iterazione (in prod potresti usare HMAC della SubtleCrypto)
        const token = btoa(`${Date.now()}:${secretKey}`);

        return jsonRes({ token, message: "Logged in successfully" });
    } catch (e) {
        return jsonRes({ error: "Bad request" }, 400);
    }
}