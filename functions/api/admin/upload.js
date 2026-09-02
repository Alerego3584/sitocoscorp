export async function onRequestPost(context) {
    const { request, env } = context;

    // Controllo auth di base (stessa logica usata in sets.js, ideally refactored in middleware)
    const authHeader = request.headers.get('Authorization') || '';
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const path = formData.get('path'); // es. "corporate/featured/jabergamo/full/image.jpg"

        if (!file || !path) {
            return new Response(JSON.stringify({ error: "Missing file or path" }), { status: 400 });
        }

        const bucket = env.ALEREGO_GALLERY;
        if (!bucket) {
            return new Response(JSON.stringify({ error: "R2 Bucket ALEREGO_GALLERY not bound" }), { status: 500 });
        }

        // Upload su R2
        await bucket.put(path, file.stream(), {
            httpMetadata: { contentType: file.type }
        });

        // L'URL pubblico dipenderà dal tuo custom domain collegato al bucket R2
        const publicUrl = `/cdn-cgi/image/quality=85/https://tuo-dominio-r2.com/${path}`; 

        return new Response(JSON.stringify({ success: true, path, publicUrl }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}