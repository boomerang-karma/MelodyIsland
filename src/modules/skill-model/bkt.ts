/**
 * Bayesian Knowledge Tracing–style skill model.
 * Each micro-skill has p(L); updates on every attempt; decays over time.
 * Enhance: replace with full BKT EM-fit parameters per skill.
 */

import { bus, type SkillMastery } from "@/modules/core";

export interface BktParams {
  /** P(L0) initial mastery */
  pL0: number;
  /** P(T) transit (learn) */
  pT: number;
  /** P(G) guess */
  pG: number;
  /** P(S) slip */
  pS: number;
  /** Daily decay toward pL0 */
  dailyDecay: number;
}

const DEFAULT_PARAMS: BktParams = {
  pL0: 0.2,
  pT: 0.15,
  pG: 0.2,
  pS: 0.1,
  dailyDecay: 0.03,
};

export class SkillModel {
  private mastery = new Map<string, SkillMastery>();
  private params: BktParams;

  constructor(params: Partial<BktParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  load(records: Record<string, SkillMastery>): void {
    this.mastery.clear();
    Object.values(records).forEach((m) => this.mastery.set(m.skillId, { ...m }));
  }

  ensure(skillId: string): SkillMastery {
    let m = this.mastery.get(skillId);
    if (!m) {
      m = {
        skillId,
        pMastery: this.params.pL0,
        attempts: 0,
        lastPracticedAt: null,
        streak: 0,
      };
      this.mastery.set(skillId, m);
    }
    return m;
  }

  /** Apply time decay since last practice */
  decay(skillId: string, now = new Date()): void {
    const m = this.ensure(skillId);
    if (!m.lastPracticedAt) return;
    const days =
      (now.getTime() - new Date(m.lastPracticedAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (days < 0.5) return;
    const decay = Math.min(0.4, days * this.params.dailyDecay);
    m.pMastery = Math.max(
      this.params.pL0,
      m.pMastery - decay * (m.pMastery - this.params.pL0),
    );
  }

  /**
   * Update mastery after an evidence event (correct / incorrect).
   * Classic BKT posterior then transit.
   */
  observe(skillId: string, correct: boolean, now = new Date()): SkillMastery {
    this.decay(skillId, now);
    const m = this.ensure(skillId);
    const { pG, pS, pT } = this.params;
    const pL = m.pMastery;

    // P(correct | L) etc.
    const pCorrect = pL * (1 - pS) + (1 - pL) * pG;
    let pLGivenObs: number;
    if (correct) {
      pLGivenObs = (pL * (1 - pS)) / (pCorrect || 1e-9);
    } else {
      const pWrong = 1 - pCorrect;
      pLGivenObs = (pL * pS) / (pWrong || 1e-9);
    }

    // Transit: learn if not yet mastered
    const pLNext = pLGivenObs + (1 - pLGivenObs) * pT;
    m.pMastery = Math.max(0.01, Math.min(0.99, pLNext));
    m.attempts += 1;
    m.lastPracticedAt = now.toISOString();
    m.streak = correct ? m.streak + 1 : 0;

    bus.emit("skill:updated", { skillId, pMastery: m.pMastery });
    return { ...m };
  }

  observeMany(skillIds: string[], correct: boolean): void {
    skillIds.forEach((id) => this.observe(id, correct));
  }

  get(skillId: string): SkillMastery {
    return { ...this.ensure(skillId) };
  }

  snapshot(): Record<string, SkillMastery> {
    const out: Record<string, SkillMastery> = {};
    this.mastery.forEach((m, id) => {
      out[id] = { ...m };
    });
    return out;
  }

  /** Skills mastered-but-decaying — for spaced review warm-ups */
  decayingSkills(threshold = 0.7, floor = 0.45): SkillMastery[] {
    const now = new Date();
    const result: SkillMastery[] = [];
    this.mastery.forEach((m) => {
      this.decay(m.skillId, now);
      const updated = this.mastery.get(m.skillId)!;
      if (updated.pMastery >= floor && updated.pMastery < threshold) {
        result.push({ ...updated });
      }
    });
    return result.sort((a, b) => a.pMastery - b.pMastery);
  }

  /** Weakest skills for remediation */
  weakest(limit = 3): SkillMastery[] {
    return Array.from(this.mastery.values())
      .sort((a, b) => a.pMastery - b.pMastery)
      .slice(0, limit);
  }

  categoryAverages(
    skillCategoryMap: Record<string, string>,
  ): Record<string, number> {
    const buckets = new Map<string, number[]>();
    this.mastery.forEach((m) => {
      const cat = skillCategoryMap[m.skillId] ?? "technique";
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat)!.push(m.pMastery);
    });
    const out: Record<string, number> = {};
    buckets.forEach((vals, cat) => {
      out[cat] = vals.reduce((a, b) => a + b, 0) / vals.length;
    });
    return out;
  }
}
