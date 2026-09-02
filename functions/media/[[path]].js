export async function onRequestGet(context) {
    const { env, params } = context;
    const bucket = env.ALEREGO_GALLERY;
    
    if (!bucket) {
        return new Response("Gallery binding not configured", { status: 500 });
    }

    // Uniamo il percorso dell'array params.path per ricostruire il percorso originale
    // params.path è gestito da Cloudflare per rotta dinamica [[path]].js
    const filePath = params.path.join('/');
    
    try {
        const obj = await bucket.get(filePath);
        if (obj === null) {
            return new Response("Not Found", { status: 404 });
        }

        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set('etag', obj.httpEtag);
        headers.set('cache-control', 'public, max-age=31536000, immutable'); // Cache per un anno

        return new Response(obj.body, { headers });
    } catch (e) {
        return new Response("Error extracting from bucket: " + e.message, { status: 500 });
    }
}
