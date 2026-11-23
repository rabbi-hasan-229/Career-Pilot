const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_AVATAR_FILE_BYTES = 5 * 1024 * 1024;
const TARGET_AVATAR_PX = 256;

export function validateAvatarImageFile(file: File): string | null {
  if (!file) return 'Choose an image file.';
  const extOk = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
  if (!ALLOWED_IMAGE_TYPES.has(file.type) && !extOk) {
    return 'Upload a JPG, PNG, WebP, or GIF image.';
  }
  if (file.size > MAX_AVATAR_FILE_BYTES) {
    return 'Profile photo must be 5 MB or smaller.';
  }
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and compresses a user-uploaded profile photo into a compact 256x256
 * cover-cropped Data URL so both learner and expert avatars persist cleanly.
 */
export async function processAvatarFileToDataUrl(file: File): Promise<string> {
  const err = validateAvatarImageFile(file);
  if (err) throw new Error(err);

  const rawDataUrl = await readAsDataUrl(file);
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_AVATAR_PX;
        canvas.height = TARGET_AVATAR_PX;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        const scale = Math.max(TARGET_AVATAR_PX / img.width, TARGET_AVATAR_PX / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = (TARGET_AVATAR_PX - drawW) / 2;
        const dy = (TARGET_AVATAR_PX - drawH) / 2;

        ctx.clearRect(0, 0, TARGET_AVATAR_PX, TARGET_AVATAR_PX);
        ctx.drawImage(img, dx, dy, drawW, drawH);

        const webp = canvas.toDataURL('image/webp', 0.86);
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.86));
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
