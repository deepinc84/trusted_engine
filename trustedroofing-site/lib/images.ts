const imageProvider = process.env.NEXT_PUBLIC_IMAGE_PROVIDER ?? "supabase";

export function getProjectImageUrl(path: string) {
  if (path.startsWith("http")) return path;
  if (imageProvider === "cloudinary") {
    const cloudinaryBase = process.env.NEXT_PUBLIC_CLOUDINARY_BASE ?? "";
    // TODO: swap to Cloudinary URLs once the account is configured.
    return cloudinaryBase ? `${cloudinaryBase}/${path}` : path;
  }
  // TODO: wire Supabase Storage public URLs when buckets are ready.
  return path;
}
