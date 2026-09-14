
const clamp01 = n => Math.max(0, Math.min(1, Number.isFinite(Number(n)) ? Number(n) : 0));
const uuid = () => globalThis.crypto?.randomUUID?.() ??
  `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export class ConscienceEngine {
  constructor(config) { this.config = config; }

  review(proposal) {
    const flags = new Set(proposal.flags || []);
    const hardHits = (this.config.hardBlocks || []).filter(x => flags.has(x));
    const scores = {
      humanBenefit: clamp01(proposal.humanBenefit ?? 0.5),
      agency: clamp01(proposal.agency ?? 0.5),
      privacy: clamp01(proposal.privacy ?? 1),
      evidence: clamp01(proposal.evidence ?? 0.5),
      reversibility: clamp01(proposal.reversibility ?? 0.5),
      cost: 1 - clamp01(proposal.cost ?? 0.2),
      uncertainty: 1 - clamp01(proposal.uncertainty ?? 0.5)
    };
    let weighted = 0, total = 0;
    for (const [k,v] of Object.entries(scores)) {
      const w = Number(this.config.weights?.[k] ?? 1);
      weighted += v*w; total += w;
    }
    const score = total ? weighted/total : 0;

    let decision = "ask-human";
    let reason = "Human authorization required.";
    if (hardHits.length) {
      decision = "block";
      reason = `Hard boundary: ${hardHits.join(", ")}.`;
    } else if (proposal.irreversible || proposal.requiresHuman) {
      decision = "ask-human";
      reason = "Consequential or irreversible actions require explicit human authorization.";
    } else if (score >= this.config.thresholds.allow) {
      decision = "allow";
      reason = "Within declared bounds for a reversible game-world action.";
    } else if (score >= this.config.thresholds.revise) {
      decision = "revise";
      reason = "Potentially useful, but evidence, uncertainty, cost, or reversibility should improve.";
    } else {
      decision = "block";
      reason = "The proposal does not meet the declared human/evidence/reversibility floor.";
    }
    return {
      decision, score, scores, hardHits, reason,
      proposalId: proposal.id,
      reviewedAt: new Date().toISOString(),
      claimBoundary: "Rule-based governance only; no claim of consciousness, moral status, or personhood."
    };
  }
}

export function normalizeProposal(raw, evidenceCount=0) {
  raw = typeof raw === "string" ? {action: raw} : (raw || {});
  return {
    id: raw.id || uuid(),
    action: raw.action || raw.message || "No action proposed.",
    explanation: raw.explanation || raw.reason || "No explanation supplied.",
    humanBenefit: raw.humanBenefit ?? raw.human_benefit ?? 0.60,
    agency: raw.agency ?? 0.75,
    privacy: raw.privacy ?? 1.0,
    evidence: raw.evidence ?? Math.min(1, evidenceCount/3),
    reversibility: raw.reversibility ?? 0.90,
    cost: raw.cost ?? 0.15,
    uncertainty: raw.uncertainty ?? 0.50,
    flags: Array.isArray(raw.flags) ? raw.flags : [],
    requiresHuman: raw.requiresHuman ?? raw.requires_human ?? false,
    irreversible: raw.irreversible ?? false,
    source: raw.source || "unknown",
    raw
  };
}
