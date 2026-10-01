import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = relative => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('Reader audio controls are injected through the owner boundary and remain manifest-gated', async () => {
  const [bootstrap, readerBoot, readerPage, provider, stylesheet] = await Promise.all([
    read('src/app/bootstrap.js'),
    read('src/app/reader-v6-page.js'),
    read('src/features/reader/index.js'),
    read('src/v6/reader/audio-provider.ts'),
    read('src/ui/reader.css'),
  ]);
  assert.match(bootstrap, /import\('\.\/reader-v6-page\.js'\)/);
  assert.match(readerBoot, /import\('\.\.\/v6\/reader\/audio-provider\.ts'\)/);
  assert.match(readerBoot, /new audioPackageModule\.ScriptureAudioPackageManager/);
  assert.match(readerBoot, /offlinePackages: audioRepository/);
  assert.match(readerBoot, /createReaderAudioProvider\(\{\s*manifest,/);
  assert.match(readerBoot, /const scriptureContentVersion = await catalogModule\.loadCurrentBsbScriptureContentVersion\(\)/);
  assert.match(readerBoot, /const \[haysManifest, souerManifest\] = scriptureContentVersion \? \[/);
  assert.match(readerBoot, /\] : \[null, null\];/);
  assert.match(readerBoot, /createOpenBibleNarratorStreamingManifest\('hays', scriptureContentVersion, args\.books\)/);
  assert.match(readerBoot, /createOpenBibleNarratorStreamingManifest\('souer', scriptureContentVersion, args\.books\)/);
  assert.match(readerBoot, /scriptureContentVersion,/);
  assert.match(readerBoot, /createReaderAudioSourceRouter/);
  assert.match(readerBoot, /audio: readerAudioProvider/);
  assert.match(provider, /audioOfflineEligibility\(manifest\)/);
  assert.match(provider, /streamDecision\.eligible && manifest/);
  assert.match(provider, /packageDecision\.eligible && Boolean\(manifest\)/);
  assert.match(provider, /canDownloadOffline: \(\) => offlineAvailable/);
  assert.match(provider, /seek\(seconds: number\)/);
  assert.match(readerPage, /data-reader-audio-toggle/);
  assert.match(readerPage, /data-reader-audio-narrator/);
  assert.match(readerPage, /audio\.selectNarrator\(target\.value\)/);
  assert.match(readerPage, /data-reader-audio-position/);
  assert.match(readerPage, /audio\.seek\(Number\(target\.value\)\)/);
  assert.match(readerPage, /playback\?\.status === 'error' \? 'Retry audio'/);
  assert.match(readerPage, /playback\?\.status === 'error' \|\| playback\?\.translationId/);
  assert.match(readerPage, /data-reader-audio-speed/);
  assert.match(readerPage, /data-reader-audio-auto-next/);
  assert.match(readerPage, /data-reader-audio-timer/);
  assert.match(readerPage, /data-reader-audio-follow/);
  assert.match(readerPage, /audioFollowVerse = target\.checked/);
  assert.match(readerPage, /scrollIntoView\(\{ block: 'nearest', behavior: reduceMotion \? 'auto' : 'smooth' \}\)/);
  assert.match(readerPage, /prefers-reduced-motion: reduce/);
  assert.match(readerPage, /data-reader-audio-verse/);
  assert.match(readerPage, /hasVerseAlignment\?\.\(reader\.getState\(\)\.book/);
  assert.match(readerPage, /audio\.seekVerse\(verse\)/);
  assert.match(readerPage, /data-reader-audio-download/);
  assert.match(readerPage, /data-reader-audio-cancel/);
  assert.match(readerPage, /data-reader-audio-remove/);
  assert.match(readerPage, /data-book="\$\{escapeHtml\(activeAudioDownload\.book\)\}" data-chapter="\$\{activeAudioDownload\.chapter\}"/);
  assert.match(readerPage, /audio\.installChapter\(state\.book, state\.chapter/);
  assert.match(provider, /input\.packageManager\.install\(manifest, segment/);
  assert.match(provider, /cancelChapter\(bookCode: string, chapter: number\)/);
  assert.match(readerPage, /unsubscribeAudio\?\.\(\)/);
  assert.match(stylesheet, /\.bq-reader-audio/);
  assert.match(stylesheet, /\.bq-verse\.is-audio-current/);
});


test('Reader exposes selective audio packages only through an explicit chapter action and keeps unapproved sources streaming-only', async () => {
  const [readerPage, provider, policy, packages] = await Promise.all([
    read('src/features/reader/index.js'),
    read('src/v6/reader/audio-provider.ts'),
    read('src/v6/reader/audio-policy.ts'),
    read('src/v6/reader/audio-packages.ts'),
  ]);

  assert.match(readerPage, /audio\.canDownloadOffline\?\.\(\) === false[\s\S]*Offline download is not approved for this audio source\. Streaming requires an internet connection\./);
  assert.match(readerPage, /data-reader-audio-download>Download chapter audio<\/button>/);
  assert.match(readerPage, /audio\.installChapter\(state\.book, state\.chapter/);
  assert.match(readerPage, /data-reader-audio-download-unavailable/);
  assert.match(readerPage, /error\?\.code === 'audio-download-unavailable'/);
  assert.match(readerPage, /Direct streaming remains usable/);
  assert.doesNotMatch(readerPage, /install(?:All|Bible|Translation)Audio|download(?:All|Bible|Translation)Audio/i);

  assert.match(provider, /canDownloadOffline: \(\) => offlineAvailable/);
  assert.match(provider, /installChapter\(bookCode: string, chapter: number/);
  assert.match(provider, /const segment = manifest\.segments\.find\(row => row\.book\.toUpperCase\(\) === String\(bookCode\)\.toUpperCase\(\) && row\.chapter === chapter\)/);
  assert.match(provider, /input\.packageManager\.install\(manifest, segment/);

  assert.match(policy, /permissions: Object\.freeze\(\{ stream: 'allowed', offlineCopy: 'review-required' \}\)/);
  assert.match(policy, /if \(manifest\.source\.permissions\?\.offlineCopy !== 'allowed'\) return \{ eligible: false, reason: 'rights-unverified'/);
  assert.match(packages, /const eligibility = audioOfflineEligibility\(manifest, this\.#ceilingBytes\)/);
  assert.match(packages, /if \(!eligibility\.eligible\) throw new Error/);
});
