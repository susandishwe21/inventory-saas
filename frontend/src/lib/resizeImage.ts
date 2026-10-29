// Shrink a photo in the browser before uploading: max 800×800 px, WebP (JPEG if the browser can't make WebP).
// No library: draw the image on a <canvas> and export it again.

const MAX_SIZE = 800;
const QUALITY = 0.85;

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
      type,
      QUALITY,
    );
  });
}

export async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file); // also applies phone photo rotation (EXIF)
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height)); // never enlarge
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await canvasToBlob(canvas, 'image/webp');
  // Some browsers silently return PNG instead of WebP; JPEG is much smaller than PNG for photos
  return webp.type === 'image/webp' ? webp : canvasToBlob(canvas, 'image/jpeg');
}
