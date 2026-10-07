import { evaluateV7LibraryApproval } from './automated-approval-policy.js';

const DEFAULT_MINIMUM_DEVOTIONALS = 150;

const REPAIR_ACTIONS = Object.freeze({
  source_identity: 'reacquire_or_replace_source',
  provenance: 'reacquire_or_replace_source',
  source_fidelity: 'reextract_or_regenerate_from_source',
  scripture_reference_validity: 'repair_scripture_references',
  scripture_context: 'repair_scripture_context',
  theological_fidelity: 'regenerate_content',
  editorial_coherence: 'rewrite_content',
  audience_suitability: 'rewrite_for_audience',
  duplicate_fragment_detection: 'deduplicate_or_replace',
  emotion_need_relevance: 'retag_or_replace',
  catalog_diversity: 'retag_or_replace',
  revision_integrity: 'rebuild_exact_revision',
  metadata_integrity: 'rebuild_metadata',
  adversarial_qa: 'repair_then_rerun_adversarial_qa',
  translation_completeness: 'regenerate_missing_translations',
  translation_semantic_fidelity: 'regenerate_low_confidence_translations',
  translation_naturalness: 'rewrite_translation_naturalness',
  independent_second_pass_incomplete: 'rerun_independent_second_pass'
});

function clean(value) {
  return String(value ?? '').trim();
}

function positiveInteger(value, fallback) {
  const normalized = Number(value);
  return Number.isSafeInteger(normalized) && normalized > 0 ? normalized : fallback;
}

function unique(values) {
  return Object.freeze([...new Set(values.filter(Boolean))]);
}

function repairActions(decision) {
  const reasons = Array.isArray(decision?.repairReasons) ? decision.repairReasons : [];
  return unique(reasons.map(reason => REPAIR_ACTIONS[reason] || 'repair_and_reevaluate'));
}

function replacementReason(decision) {
  const reasons = Array.isArray(decision?.rejectionReasons) ? decision.rejectionReasons : [];
  if (reasons.some(reason => ['rights_not_verified', 'no_permitted_use', 'permitted_use_rights'].includes(reason))) {
    return 'rights_or_permitted_use';
  }
  if (reasons.includes('fixture_source')) return 'fixture_source';
  if (reasons.includes('second_pass_revision_mismatch')) return 'stale_revision_evidence';
  return 'terminal_policy_rejection';
}

export function buildV7LibraryMachineWorkQueue(decisions, { minimumDevotionals = DEFAULT_MINIMUM_DEVOTIONALS } = {}) {
  if (!Array.isArray(decisions)) throw new TypeError('decisions must be an array');
  const minimum = positiveInteger(minimumDevotionals, DEFAULT_MINIMUM_DEVOTIONALS);
  const work = [];

  for (const decision of decisions) {
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) throw new TypeError('each decision must be an object');
    const itemId = clean(decision.itemId);
    const revision = clean(decision.revision);
    const contentType = clean(decision.contentType);
    if (!itemId || !revision || !contentType) throw new TypeError('decision itemId, revision and contentType are required');

    if (decision.outcome === 'needs_repair') {
      work.push(Object.freeze({
        kind: 'repair',
        itemId,
        revision,
        contentType,
        actions: repairActions(decision),
        reasons: unique(decision.repairReasons || []),
        retryPolicy: 'repair_then_full_policy_reevaluation'
      }));
    } else if (decision.outcome === 'rejected') {
      work.push(Object.freeze({
        kind: 'replace',
        itemId,
        revision,
        contentType,
        actions: Object.freeze(['exclude_from_release', 'select_rights_clear_replacement']),
        reasons: unique(decision.rejectionReasons || []),
        replacementReason: replacementReason(decision),
        retryPolicy: 'replacement_enters_full_policy_evaluation'
      }));
    } else if (decision.outcome !== 'auto_approved') {
      throw new TypeError(`unsupported automated outcome ${decision.outcome}`);
    }
  }

  const approvedDevotionals = decisions.filter(row => row?.contentType === 'devotional' && row?.outcome === 'auto_approved').length;
  const devotionalDeficit = Math.max(0, minimum - approvedDevotionals);
  if (devotionalDeficit > 0) {
    work.push(Object.freeze({
      kind: 'backfill',
      contentType: 'devotional',
      count: devotionalDeficit,
      actions: Object.freeze(['select_rights_clear_candidates', 'generate_required_translations', 'run_full_policy_evaluation']),
      reasons: Object.freeze(['approved_release_catalog_below_minimum']),
      retryPolicy: 'continue_until_minimum_auto_approved_count'
    }));
  }

  return Object.freeze({
    schemaVersion: 1,
    scope: 'v7_library_machine_repair_queue',
    minimumDevotionals: minimum,
    approvedDevotionals,
    devotionalDeficit,
    releaseFloorSatisfied: devotionalDeficit === 0,
    work: Object.freeze(work)
  });
}

export function evaluateV7LibraryBatch({
  items,
  evaluationsByItem = {},
  secondPassByItem = {},
  decidedAt = new Date().toISOString(),
  minimumDevotionals = DEFAULT_MINIMUM_DEVOTIONALS
} = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const decisions = items.map(item => evaluateV7LibraryApproval({
    item,
    evaluations: evaluationsByItem[item.id] || [],
    secondPass: secondPassByItem[item.id],
    decidedAt
  }));
  return Object.freeze({
    schemaVersion: 1,
    decisions: Object.freeze(decisions),
    machineWork: buildV7LibraryMachineWorkQueue(decisions, { minimumDevotionals })
  });
}

export const V7_LIBRARY_MINIMUM_RELEASE_DEVOTIONALS = DEFAULT_MINIMUM_DEVOTIONALS;
