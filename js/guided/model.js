export function frame(source, phase, summary, guide, extra = {}) {
  return {
    ...source,
    id: `guided-${source.id}`,
    phase,
    summary,
    guide: structuredClone(guide),
    ...extra
  };
}

export function prediction(source, question, guide = source.guide) {
  return {
    ...source,
    id: `${source.id}-predict`,
    phase: "Your turn",
    summary: question.prompt,
    guide: structuredClone(guide),
    chapter: "Predict",
    question
  };
}

export function explanation(source, proof) {
  return {
    ...source,
    id: `${source.id}-explain`,
    phase: "Why it works",
    chapter: "Explain",
    summary: proof.invariant,
    proof,
    guide: { ...structuredClone(source.guide), done: true }
  };
}

export function guidedTrace(trace, snapshots, proof) {
  return { ...trace, snapshots: [...snapshots, explanation(snapshots.at(-1), proof)] };
}
