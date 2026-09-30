import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../src/features/notification-center/index.js', import.meta.url), 'utf8');

test('Notification Center routes decorative notification symbols through the shared icon registry', () => {
  assert.match(source, /import\s*\{\s*iconSvg\s*\}\s*from\s*['"]\.\.\/\.\.\/ui\/icons\.js['"]/);
  assert.match(source, /NOTIFICATION_ICON_NAMES=Object\.freeze\(\{/);
  assert.match(source, /notificationIcon\(item\.type\)/);

  for (const type of ['assignment','feedback','devotional','announcement','activity','encouragement','poll','award','media','info']) {
    assert.match(source, new RegExp(`${type}:'[a-z-]+'`), `missing shared icon mapping for ${type}`);
  }

  assert.doesNotMatch(source, /[📮💬📖📣🧭💛📊🏅🎬🔔]/u);
});
