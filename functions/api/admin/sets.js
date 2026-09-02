// API Endpoint per /api/admin/sets
// Metodo GET: Elenca tutti i set caricati da KV

// Helper per check auth (estrarremo in un file _middleware.js dedicato successivamente)
function verifyAuth(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) return false;
    
    const secretKey = env.JWT_SECRET || 'secret-fallback-key-do-not-use-in-prod';
    
    try {
        const decoded = atob(token);
        const [ts, tkSecret] = decoded.split(':');
        
        // Verifica che il secret combaci e che il token non sia troppo vecchio (es. validità 24h)
        if (tkSecret !== secretKey) return false;
        
        const age = Date.now() - parseInt(ts, 10);
        if (age > 1000 * 60 * 60 * 24) return false; // expired
        
        return true;
    } catch {
        return false;
    }
}

const jsonRes = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
};

export async function onRequestGet(context) {
    const { request, env } = context;

    // Controllo Sicurezza
    if (!verifyAuth(request, env)) {
        return jsonRes({ error: "Unauthorized" }, 401);
    }

    try {
        // La variabile env.ALEREGO_META sarà il binding al namespace KV
        const db = env.ALEREGO_META;
        
        if (!db) {
            return jsonRes({ error: 'ALEREGO_META KV binding not configured in Cloudflare Pages settings' }, 500);
        }

        // Il DB KV restituirà le chiavi, che per strutturarlo a set possiamo chiamare ad es. "set:cosplay:nome-set"
        // Ora implementiamone un mock per poter testare l'UI finché non le configuri su CF
        let storedSets = await db.get("galleries_metadata", "json");

        // Dati finti di fallback se il KV è vuoto:
        if (!storedSets || !storedSets.length) {
            storedSets = [];
        }

        return jsonRes({ sets: storedSets });
    } catch (e) {
        return jsonRes({ error: e.message }, 500);
    }
}

// REST POST: Salva / Aggiorna tutti i set nel DB KV
export async function onRequestPost(context) {
    const { request, env } = context;

    if (!verifyAuth(request, env)) {
        return jsonRes({ error: "Unauthorized" }, 401);
    }

    try {
        const body = await request.json();
        const db = env.ALEREGO_META;
        
        if (!db) {
            return jsonRes({ error: 'ALEREGO_META KV binding not configured in Cloudflare Pages settings' }, 500);
        }

        // Sovrascrive/aggiorna lo stato generale dei set
        await db.put("galleries_metadata", JSON.stringify(body.sets));

        return jsonRes({ success: true, message: "Modifiche salvate con successo!" });
    } catch (e) {
        return jsonRes({ error: e.message }, 500);
    }
}