import { jsonRes, verifyAuth, isAllowedUploadPath, isAllowedUpload } from "./_auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await verifyAuth(request, env))) {
    return jsonRes({ error: "Unauthorized" }, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const objectPath = formData.get("path");

    if (!file || !objectPath) {
      return jsonRes({ error: "Missing file or path" }, 400);
    }

    if (!isAllowedUploadPath(String(objectPath))) {
      return jsonRes({ error: "Invalid upload path" }, 400);
    }

    const allowed = isAllowedUpload(file);
    if (!allowed.ok) {
      return jsonRes({ error: allowed.error }, 400);
    }

    const bucket = env.ALEREGO_GALLERY;
    if (!bucket) {
      return jsonRes({ error: "R2 Bucket ALEREGO_GALLERY not bound" }, 500);
    }

    await bucket.put(objectPath, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" }
    });

    return jsonRes({
      success: true,
      path: objectPath,
      publicUrl: `/media/${objectPath}`
    });
  } catch (e) {
    return jsonRes({ error: e.message }, 500);
  }
}
