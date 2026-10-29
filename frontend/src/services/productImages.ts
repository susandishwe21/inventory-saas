// Product images in Supabase Storage (public bucket "product-images")

import { supabase } from '../lib/supabase';

const BUCKET = 'product-images';

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// Public URL of a stored image (no network request, just builds the URL)
export function productImageUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Upload to "<productId>/<random>.webp" and return that path.
// A new random name every time, so browsers never show an old cached picture.
export async function uploadProductImage(productId: string, image: Blob): Promise<string> {
  const path = `${productId}/${crypto.randomUUID()}.${EXTENSIONS[image.type] ?? 'jpg'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, image, {
    contentType: image.type,
    cacheControl: '31536000', // 1 year: the file at this path never changes
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return path;
}

export async function deleteProductImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Could not delete the image: ${error.message}`);
}
