export const CSP_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' https://cdn.jsdelivr.net https://www.youtube.com https://s.ytimg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self' data:",
  "connect-src 'self' https://zkfmgezvzugchcwppreq.supabase.co wss://zkfmgezvzugchcwppreq.supabase.co https://openbible.com https://cdn.jsdelivr.net https://api.pwnedpasswords.com",
  "media-src 'self' blob: https://openbible.com",
  "frame-src 'self' https://www.youtube.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "form-action 'self'",
].join('; ') + ';';

export const CSP_REPORT_ONLY_POLICY = CSP_POLICY;
export const CSP_ENFORCING_POLICY = CSP_POLICY;

export function validateCspPolicy(value = CSP_POLICY) {
  const directives = new Map();
  for (const raw of String(value || '').split(';')) {
    const part = raw.trim();
    if (!part) continue;
    const [name, ...values] = part.split(/\s+/);
    directives.set(name.toLowerCase(), new Set(values));
  }
  const failures = [];
  for (const name of ['default-src','base-uri','object-src','frame-ancestors','script-src','style-src','img-src','font-src','connect-src','media-src','frame-src','worker-src','manifest-src','form-action']) {
    if (!directives.has(name)) failures.push(`missing CSP directive: ${name}`);
  }
  const script = directives.get('script-src') ?? new Set();
  if (!script.has("'self'")) failures.push("script-src missing 'self'");
  if (script.has("'unsafe-inline'")) failures.push("script-src must not allow 'unsafe-inline'");
  if (script.has("'unsafe-eval'")) failures.push("script-src must not allow 'unsafe-eval'");
  for (const forbidden of ['*','data:','blob:']) if (script.has(forbidden)) failures.push(`script-src must not allow ${forbidden}`);
  for (const [name, values] of directives) {
    for (const entry of values) if (/^http:\/\//i.test(entry)) failures.push(`${name} contains insecure HTTP source: ${entry}`);
  }
  for (const required of ['https://cdn.jsdelivr.net','https://www.youtube.com','https://s.ytimg.com']) {
    if (!script.has(required)) failures.push(`script-src missing ${required}`);
  }
  const connect = directives.get('connect-src') ?? new Set();
  for (const required of ["'self'",'https://zkfmgezvzugchcwppreq.supabase.co','wss://zkfmgezvzugchcwppreq.supabase.co','https://openbible.com','https://cdn.jsdelivr.net','https://api.pwnedpasswords.com']) {
    if (!connect.has(required)) failures.push(`connect-src missing ${required}`);
  }
  if (!(directives.get('frame-src') ?? new Set()).has('https://www.youtube.com')) failures.push('frame-src missing https://www.youtube.com');
  return [...new Set(failures)];
}
