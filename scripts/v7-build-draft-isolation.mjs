import { relative, resolve } from 'node:path';

// QA masters are served only by the disposable browser harness, never by the
// compatibility data copy. Approved artwork uses the audited publisher.
export function mayCopyCompatibilityData(path, root) {
  const name = relative(resolve(root), resolve(path)).replaceAll('\\', '/');
  const staging = 'data/v7/visual-assets/qa-candidates';
  return name !== staging && !name.startsWith(staging + '/');
}
