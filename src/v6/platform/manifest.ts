export interface ManifestIconLike {
  readonly src?: string;
  readonly sizes?: string;
  readonly type?: string;
  readonly purpose?: string;
}

export interface ManifestLike {
  readonly start_url?: string;
  readonly scope?: string;
  readonly display?: string;
  readonly icons?: readonly ManifestIconLike[];
}

export interface ManifestValidation {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

export function validateBibleQuestManifest(manifest: ManifestLike): ManifestValidation {
  const issues: string[] = [];
  if (manifest.start_url !== '.' && manifest.start_url !== './') issues.push('start_url must remain deployment-relative');
  if (manifest.scope !== './') issues.push('scope must remain ./');
  if (manifest.display !== 'standalone') issues.push('display must remain standalone');
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  if (!icons.some((icon) => icon.sizes === '192x192')) issues.push('192x192 icon is required');
  if (!icons.some((icon) => icon.sizes === '512x512')) issues.push('512x512 icon is required');
  if (!icons.some((icon) => String(icon.purpose ?? '').split(/\s+/).includes('maskable'))) issues.push('maskable icon is required');
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
}
