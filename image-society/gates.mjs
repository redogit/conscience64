import { deepFreeze } from './contracts.mjs';

const TARGETS = new Set(['experimental', 'accepted-noncanonical', 'mmo-production-canon']);

export function evaluatePromotionGate(candidate = {}, reviews = {}, options = {}) {
  const target = options.target ?? 'experimental';
  if (!TARGETS.has(target)) throw new TypeError(`unknown promotion target: ${target}`);
  const blockers = [];
  const warnings = [];
  const critical = Array.isArray(candidate.critical_unresolved) ? candidate.critical_unresolved : [];

  if (critical.length) blockers.push('critical-unresolved-defects');

  if (target === 'experimental') {
    return deepFreeze({ allowed: blockers.length === 0, target, blockers, warnings });
  }

  if (reviews.provenance !== 'pass') blockers.push('provenance-review-required');

  if (target === 'accepted-noncanonical') {
    if (reviews.authority === 'fail') blockers.push('authority-review-failed');
    return deepFreeze({ allowed: blockers.length === 0, target, blockers, warnings });
  }

  if (candidate.status !== 'authority-reviewed-candidate' && candidate.status !== 'human-approved-asset') {
    blockers.push('authority-reviewed-candidate-required');
  }
  for (const [name, blocker] of [
    ['continuity', 'continuity-review-required'],
    ['accessibility', 'accessibility-review-required'],
    ['authority', 'authority-review-required']
  ]) {
    if (!['pass', 'not-applicable'].includes(reviews[name])) blockers.push(blocker);
  }
  const classification = reviews.reality_classification ?? candidate.reality_classification;
  if (!classification || classification === 'unknown') blockers.push('reality-classification-required');

  const approval = options.human_approval;
  if (!approval || typeof approval !== 'object' || !String(approval.actor_id ?? '').trim()) {
    blockers.push('human-approval-required');
  }

  if (Number(reviews.model_votes ?? 0) > 0) warnings.push('model-votes-are-non-authoritative');
  return deepFreeze({ allowed: blockers.length === 0, target, blockers: [...new Set(blockers)], warnings });
}
