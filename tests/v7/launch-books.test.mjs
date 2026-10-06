import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const representative = parseV7ContentBundle(readJson('../../data/v7/books/representative-catalog.json')).items;
const expansion = parseV7ContentBundle(readJson('../../data/v7/books/library-expansion-candidates.json')).items;
const launch = readJson('../../data/v7/books/launch-catalog-summary.json');
const books = [...representative, ...expansion];

test('Lane A finalizes exactly eight launch books with stable unique IDs', () => {
  assert.equal(books.length, 8);
  assert.equal(launch.launchCount, 8);
  assert.equal(new Set(books.map(item => item.id)).size, 8);
  assert.deepEqual(new Set(launch.items.map(item => item.contentId)), new Set(books.map(item => item.id)));
});

test('all V7 launch books remain fail-closed external-link-only records', () => {
  for (const book of books) {
    assert.equal(book.type, 'book');
    assert.equal(book.source.kind, 'external');
    assert.equal(book.rights.status, 'verified');
    assert.deepEqual(book.rights.allowedUses, ['external_link']);
    assert.equal(book.sourceContent.body, undefined);
    assert.equal(book.publicationState, 'pending_review');
    assert.equal(book.review.status, 'pending_review');
    assert.match(book.source.uri, /^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/);
  }
});

test('launch-book summary forbids hosted content and direct downloads', () => {
  assert.equal(launch.status, 'ready_for_automated_policy_review');
  assert.equal(launch.policy.mode, 'external_link_only');
  assert.equal(launch.policy.hostedTextAllowed, false);
  assert.equal(launch.policy.hostedImagesAllowed, false);
  assert.equal(launch.policy.directDownloadAllowed, false);
  assert.equal(launch.policy.sourceNavigationRequiresApprovedPublication, true);
  assert.equal(launch.releaseBoundary.allEightPresent, true);
  assert.equal(launch.releaseBoundary.allRightsVerified, true);
  assert.equal(launch.releaseBoundary.allExternalLinkOnly, true);
  assert.equal(launch.releaseBoundary.allUnhosted, true);
  assert.equal(launch.releaseBoundary.noHumanReviewRequiredForLaneA, true);
  assert.ok(launch.items.every(item => item.policyDecision === 'external_link_only'));
  assert.ok(launch.items.every(item => item.laneBAutomatedApprovalRequired === true));
});
