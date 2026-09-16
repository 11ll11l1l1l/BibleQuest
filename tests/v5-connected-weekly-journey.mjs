import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HOME_WEEKLY_JOURNEY_ROUTES, HOME_WEEK_LOCALES, homeThisWeekIntroHtml } from '../src/features/home/today-this-week.js';

const weekPath = new URL('../src/features/home/today-this-week.js', import.meta.url);
const expectedRoutes = ['recordings', 'reader', 'transform', 'journey-groups', 'assignments', 'calendar'];

test('weekly journey is a fixed composition over existing owners only', async () => {
  assert.deepEqual([...HOME_WEEKLY_JOURNEY_ROUTES], expectedRoutes);
  assert.deepEqual([...HOME_WEEK_LOCALES].sort(), ['en', 'tl']);
  const source = await readFile(weekPath, 'utf8');
  for (const route of expectedRoutes) assert.match(source, new RegExp(`route: '${route.replace('-', '\\-')}'`));
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|createApi|supabase|fetch\(|XMLHttpRequest|new WebSocket|new EventSource/i);
  assert.doesNotMatch(source, /insert\(|update\(|delete\(|persist|repository|workflow engine/i);
});

test('weekly journey presents service to Scripture to reflection to community to action to Calendar in EN and TL', () => {
  for (const locale of ['en', 'tl']) {
    const html = homeThisWeekIntroHtml(locale);
    const indexes = expectedRoutes.map(route => html.indexOf(`data-weekly-journey-route="${route}"`));
    indexes.forEach((index, i) => assert.ok(index >= 0, `${locale} missing ${expectedRoutes[i]} weekly journey route`));
    for (let i = 1; i < indexes.length; i += 1) assert.ok(indexes[i] > indexes[i - 1], `${locale} weekly journey route order is incorrect`);
    assert.match(html, /data-home-weekly-journey/);
    assert.match(html, /data-weekly-journey-step="service"/);
    assert.match(html, /data-weekly-journey-step="scripture"/);
    assert.match(html, /data-weekly-journey-step="reflect"/);
    assert.match(html, /data-weekly-journey-step="discuss"/);
    assert.match(html, /data-weekly-journey-step="act"/);
    assert.match(html, /data-weekly-journey-step="plan"/);
  }
});

test('weekly journey includes one optional non-interactive Ask at Dinner prompt in EN and TL', () => {
  const expected = {
    en: ['ASK AT DINNER · OPTIONAL', 'What did God show us this week, and how can we live it out together?'],
    tl: ['PAG-USAPAN SA HAPUNAN · OPSYONAL', 'Ano ang ipinakita sa atin ng Diyos ngayong linggo, at paano natin ito maisasabuhay nang magkakasama?']
  };
  for (const locale of ['en', 'tl']) {
    const html = homeThisWeekIntroHtml(locale);
    const prompts = html.match(/data-weekly-dinner-prompt/g) || [];
    assert.equal(prompts.length, 1, `${locale} must render exactly one dinner prompt`);
    assert.match(html, new RegExp(expected[locale][0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(expected[locale][1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const promptHtml = html.match(/<aside[^>]*data-weekly-dinner-prompt[\s\S]*?<\/aside>/)?.[0] || '';
    assert.doesNotMatch(promptHtml, /<a\b|<button\b|<form\b|data-weekly-journey-route=/i, `${locale} dinner prompt must remain optional content, not a scored or routed action`);
  }
});

test('weekly journey language does not claim automatic sermon-to-passage inference', async () => {
  const source = await readFile(weekPath, 'utf8');
  assert.match(source, /Open the Bible to read the passage or context connected to what you heard/);
  assert.match(source, /Buksan ang Biblia para basahin ang talata o kontekstong kaugnay ng iyong narinig/);
  assert.doesNotMatch(source, /automatically detect|auto-match|AI-generated passage|YouTube Data API|webhook ingestion/i);
});
