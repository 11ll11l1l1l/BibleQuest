import {deny, inspectUpload} from './policy.mjs';

const FILES = 'https://www.googleapis.com/drive/v3/files';
const FIELDS = 'id,name,mimeType,size,parents,trashed,appProperties';
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value);

// Only instantiate on the server. Tokens and response bodies must never be logged or sent to clients.
// The configured folder must have restricted inheritance; this adapter never grants public access.
export function createDriveProvider({folderId, getAccessToken, fetchImpl = fetch, timeoutMs = 15000}) {
  if (!validId(folderId) || typeof getAccessToken !== 'function') deny('MEDIA_PROVIDER_CONFIG');
  async function request(url, init = {}) {
    const token = await getAccessToken();
    if (!token || typeof token !== 'string') deny('MEDIA_PROVIDER_AUTH');
    let response;
    try {
      response = await fetchImpl(url, {...init, redirect: 'error', signal: AbortSignal.timeout(timeoutMs), headers: {...init.headers, Authorization: `Bearer ${token}`}});
    } catch { deny('MEDIA_PROVIDER_UNAVAILABLE'); }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) deny('MEDIA_PROVIDER_DENIED');
      if (response.status === 404) deny('MEDIA_PROVIDER_MISSING');
      if (response.status === 429) deny('MEDIA_PROVIDER_RATE_LIMIT');
      if (response.status === 507) deny('MEDIA_QUOTA_EXHAUSTED');
      deny('MEDIA_PROVIDER_UNAVAILABLE');
    }
    return response;
  }
  function checkObject(row, assetId) {
    if (!validId(row?.id) || row.trashed || !row.parents?.includes(folderId) || row.appProperties?.bqAssetId !== assetId) deny('MEDIA_PROVIDER_IDENTITY');
    return row;
  }
  async function inspect(objectId, assetId) {
    if (!validId(objectId) || !validId(assetId)) deny('MEDIA_PROVIDER_IDENTITY');
    const response = await request(`${FILES}/${objectId}?supportsAllDrives=true&fields=${FIELDS}`);
    return checkObject(await response.json(), assetId);
  }
  async function upload({assetId, name, mimeType, bytes}) {
    if (!validId(assetId)) deny('MEDIA_ASSET_ID');
    const file = inspectUpload({name, mimeType, bytes});
    // A caller must reserve quota and an idempotency lease before invoking upload.
    const boundary = `bq_${crypto.randomUUID().replaceAll('-', '')}`;
    const metadata = {name: file.name, mimeType, parents: [folderId], appProperties: {bqAssetId: assetId}};
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`, bytes, `\r\n--${boundary}--\r\n`,
    ]);
    const response = await request(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=${FIELDS}`, {method: 'POST', headers: {'Content-Type': `multipart/related; boundary=${boundary}`}, body});
    const row = checkObject(await response.json(), assetId);
    if (Number(row.size) !== file.byteSize || row.mimeType !== mimeType) deny('MEDIA_PROVIDER_INTEGRITY');
    return Object.freeze({provider: 'google_drive', objectId: row.id, byteSize: file.byteSize, mimeType});
  }
  async function download(objectId, assetId) {
    await inspect(objectId, assetId);
    // Caller authorizes metadata before this call and proxies the body with private/no-store headers.
    return request(`${FILES}/${objectId}?alt=media&supportsAllDrives=true`);
  }
  async function trash(objectId, assetId) {
    await inspect(objectId, assetId);
    await request(`${FILES}/${objectId}?supportsAllDrives=true`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({trashed: true})});
  }
  return Object.freeze({upload, inspect, download, trash});
}
