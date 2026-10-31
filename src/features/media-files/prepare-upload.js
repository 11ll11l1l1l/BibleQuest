export async function prepareMediaUpload(file) {
  if (!(file instanceof Blob) || !file.size || file.size > 25 * 1024 * 1024) throw new Error('MEDIA_FILE_SIZE');
  if (file.type === 'application/pdf') {
    if (file.size > 5 * 1024 * 1024) throw new Error('MEDIA_FILE_SIZE');
    return file;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('MEDIA_FILE_TYPE');
  // Re-encode pixels rather than forwarding the original EXIF/GPS metadata.
  const image = await createImageBitmap(file, {imageOrientation: 'from-image'});
  try {
    if (!image.width || !image.height || image.width * image.height > 80_000_000) throw new Error('MEDIA_FILE_SIZE');
    const scale = Math.min(1, 2560 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('MEDIA_PREPARATION_FAILED');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const output = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!output || output.size > 5 * 1024 * 1024) throw new Error('MEDIA_FILE_SIZE');
    return new File([output], `${String(file.name || 'photo').replace(/\.[^.]+$/, '').slice(0, 140)}.jpg`, {type: 'image/jpeg'});
  } finally { image.close(); }
}
