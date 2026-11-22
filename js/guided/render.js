import { escapeHTML as html } from "../renderers.js";

function cell(value, index, { className = "", label = "", anchor = `slot-${index}` } = {}) {
  return `<div class="guide-cell ${className}" data-anchor="${anchor}" aria-label="${html(label || `Index ${index}: ${value}`)}"><span class="guide-value">${html(value)}</span><small>${index}</small></div>`;
}

function track(values, renderCell, overlay = "") {
  return `<div class="guide-array-scroll"><div class="guide-array-track" style="--count:${Math.max(1, values.length)}"><div class="guide-cells">${values.map(renderCell).join("") || '<p class="guide-empty">Empty array</p>'}</div>${overlay}</div></div>`;
}

function pointer(label, index, length, className = "") {
  if (index === null || index >= length) return "";
  return `<span class="guide-pointer ${className}" data-motion-key="${label}" style="left:${(index + 0.5) / length * 100}%">${label}</span>`;
}

function move(guide) {
  const { values, read, write, done } = guide;
  return `<div class="guide-board">
    <p class="guide-board-label">Same array. Nonzeros must keep their order.</p>
    ${track(values, (value, index) => cell(value, index, {
      className: `${index < write ? "kept" : done ? "" : "unfinished"} ${index === read ? "reading" : ""} ${index === guide.filling ? "filling" : ""}`,
      label: `Index ${index}: ${value}${index < write ? ", kept in original order" : done ? "" : ", unfinished"}`
    }), pointer("read", read, values.length) + pointer("write", write, values.length, "write-pointer"))}
    <div class="guide-counters"><span>read <b>${read === null || read >= values.length ? "finished" : read}</b></span><span>write <b>${write}</b></span></div>
    <p class="guide-legend"><i class="legend-kept"></i> Kept prefix <i class="legend-pending"></i> Unfinished tail</p>
    ${guide.copy ? `<p class="guide-operation">Copy ${html(guide.copy.text)} from index ${guide.copy.from.split("-").at(-1)} to index ${guide.copy.to.split("-").at(-1)}. The old tail is still unfinished.</p>` : ""}
    ${done ? `<p class="guide-result">Result <strong>[${values.join(", ")}]</strong></p>` : ""}
  </div>`;
}

function windowView(guide) {
  const { values, start, k, sum, bestSum } = guide;
  const marker = `<div class="window-range" data-motion-key="window-range" style="left:${start / values.length * 100}%;width:${k / values.length * 100}%"><span>${k === 1 ? "one value" : `exactly ${k} neighbors`}</span></div>`;
  return `<div class="guide-board">
    <p class="guide-board-label">Choose a consecutive group, not the largest individual values.</p>
    ${track(values, (value, index) => cell(value, index, { className: index >= start && index < start + k ? "in-window" : "" }), marker)}
    <div class="guide-equation">${html(guide.equation)}</div>
    <div class="guide-counters"><span>current sum <b>${sum}</b></span><span>best sum <b>${bestSum}</b></span><span>fixed divisor <b>${k}</b></span></div>
    ${guide.done ? `<p class="guide-result">Winning range ${guide.bestStart}..${guide.bestStart + k - 1}<strong>${bestSum} / ${k} = ${bestSum / k}</strong></p>` : ""}
  </div>`;
}

function oranges(guide) {
  const { grid, times, minute, frontier, changed = [], edges = [] } = guide;
  const rows = grid.length, cols = grid[0].length;
  const arrows = edges.map(([from, to]) => {
    const [r1, c1] = from, [r2, c2] = to;
    const dx = c2 - c1, dy = r2 - r1;
    return `<line x1="${c1 * 64 + 32 + dx * 21}" y1="${r1 * 64 + 32 + dy * 21}" x2="${c2 * 64 + 32 - dx * 25}" y2="${r2 * 64 + 32 - dy * 25}" marker-end="url(#guidedWaveArrow)" class="wave-arrow" />`;
  }).join("");
  const oranges = grid.map((row, r) => row.map((value, c) => {
    const x = c * 64 + 32, y = r * 64 + 32;
    const isNew = changed.some(([nr, nc]) => nr === r && nc === c);
    const description = value === 0 ? "empty" : value === 1 ? "fresh" : `rotten since minute ${times[r][c]}`;
    return `<g transform="translate(${x},${y})" class="orange-cell ${value === 0 ? "empty" : value === 1 ? "fresh" : "rotten"}" data-anchor="orange-${r}-${c}" ${isNew ? 'data-arrival="true"' : ""}><title>Row ${r}, column ${c}: ${description}</title><rect x="-28" y="-28" width="56" height="56" rx="7" />${value ? `<circle r="19" /><path d="M0,-19 Q3,-28 10,-24" /><text text-anchor="middle" dy="5">${value === 1 ? "F" : times[r][c]}</text>` : '<text text-anchor="middle" dy="5">·</text>'}</g>`;
  }).join("")).join("");
  return `<div class="guide-board">
    <div class="guide-counters"><span>minute <b>${minute}</b></span><span>fresh remaining <b>${guide.fresh}</b></span></div>
    <svg class="orange-grid" viewBox="0 0 ${cols * 64} ${rows * 64}" role="img" aria-label="Oranges at minute ${minute}; ${guide.fresh} fresh remain"><defs><marker id="guidedWaveArrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4" fill="#2b543c" /></marker></defs>${oranges}${arrows}</svg>
    <p class="guide-legend">F = fresh · number = minute it rotted · dot = empty</p>
    <div class="frontier"><span>Current frontier (row, column)</span><div>${frontier.length ? frontier.map(([r, c]) => `<span class="frontier-cell" data-motion-key="frontier-${r}-${c}">(${r}, ${c})</span>`).join("") : "No cells left to spread from"}</div></div>
    ${guide.done ? `<p class="guide-result">Return <strong>${guide.result}${guide.result === -1 ? " — fresh fruit is unreachable" : guide.result === 0 ? " — no fresh fruit to rot" : ` minutes`}</strong></p>` : ""}
  </div>`;
}

function temperatures(guide) {
  const { values, day, stack, waits } = guide;
  const hasResolved = guide.resolved !== null && guide.resolved !== undefined;
  const distance = hasResolved ? day - guide.resolved : null;
  return `<div class="guide-board">
    <p class="guide-board-label">A day waits for a strictly higher temperature.</p>
    ${track(values, (value, index) => cell(`${value}°`, index, {
      className: index === day ? "reading" : index > day && !guide.done ? "unfinished" : "",
      anchor: `day-${index}`,
      label: `Day ${index}: ${value} degrees${index === day ? ", today" : ""}`
    }), pointer("today", day, values.length))}
    <div class="waiting-stack"><span>Waiting indexes<br /><small>bottom → top</small></span><div>${stack.map((index) => `<span class="waiting-day" data-motion-key="waiting-${index}" data-anchor="waiting-${index}"><b>day ${index}</b><small>${values[index]}°</small></span>`).join("") || '<span class="guide-empty">No days waiting</span>'}</div></div>
    <p class="guide-board-label">Days to wait <span>(? means not answered yet)</span></p>
    ${track(waits, (value, index) => cell(value, index, { anchor: `answer-${index}`, className: value === "?" ? "unfinished" : "kept", label: `Day ${index}: ${value === "?" ? "still waiting" : `${value} days to wait`}` }))}
    ${hasResolved ? `<p class="guide-operation">day ${day} − day ${guide.resolved} = ${distance} ${distance === 1 ? "day" : "days"}</p>` : ""}
    ${guide.done ? `<p class="guide-result">Result <strong>[${waits.join(", ")}]</strong></p>` : ""}
  </div>`;
}

function robber(guide) {
  const { values, day, twoBack, oneBack, take, skip, best, history, pending } = guide;
  const houses = values.map((value, index) => `<div class="guide-house ${index === day ? "current-house" : ""} ${index > day && !guide.done ? "unfinished" : ""}" data-anchor="house-${index}"><div class="house-roof"></div><b>${value}</b><small>house ${index}</small><span>${index < history.length ? `best ${history[index]}` : "not visited"}</span></div>`).join("");
  return `<div class="guide-board">
    <p class="guide-board-label">Choose houses without choosing two neighbors.</p>
    <div class="guide-houses">${houses}</div>
    <div class="dp-memory" aria-label="Prefix totals before the current house"><div><span>twoBack</span><b>${twoBack}</b><small>best before the neighbor</small></div><div><span>oneBack</span><b>${oneBack}</b><small>best through the neighbor</small></div></div>
    ${day >= 0 && day < values.length ? `<div class="dp-decision">
      <div class="${!pending && take >= skip ? "chosen" : ""}"><span>TAKE house ${day}</span><strong>${twoBack} + ${values[day]} = ${pending ? "?" : take}</strong><small>Use twoBack: leave the neighbor out.</small></div>
      <div class="${!pending && skip > take ? "chosen" : ""}"><span>SKIP house ${day}</span><strong>${pending ? "?" : skip}</strong><small>Keep oneBack: no new restriction.</small></div>
    </div>` : ""}
    ${!pending && day >= 0 ? `<p class="guide-operation">Best so far: ${best}. ${day < values.length - 1 ? "Shift the summaries for the next house." : "All houses considered."}</p>` : ""}
    ${guide.done ? `<p class="guide-result">Maximum total <strong>${guide.result}</strong></p>` : ""}
  </div>`;
}

const animations = new WeakMap();

export function renderGuidedScene(container, snapshot, { animate = true } = {}) {
  animations.get(container)?.forEach((animation) => animation.cancel());
  const old = new Map([...container.querySelectorAll("[data-motion-key], [data-anchor]")].map((node) => [
    node.dataset.motionKey || node.dataset.anchor, node.getBoundingClientRect()
  ]));
  const views = { move, window: windowView, oranges, temperatures, robber };
  const view = views[snapshot.guide.kind];
  if (!view) throw new Error(`Unknown guided diagram: ${snapshot.guide.kind}`);
  container.innerHTML = view(snapshot.guide);
  const running = [];
  animations.set(container, running);
  if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !Element.prototype.animate) return;

  for (const node of container.querySelectorAll("[data-motion-key]")) {
    const before = old.get(node.dataset.motionKey);
    if (!before) continue;
    const after = node.getBoundingClientRect();
    const x = before.left - after.left, y = before.top - after.top;
    if (Math.abs(x) + Math.abs(y) < 1) continue;
    const base = getComputedStyle(node).transform;
    running.push(node.animate([{ transform: `translate(${x}px, ${y}px) ${base === "none" ? "" : base}` }, { transform: base }], { duration: 650, easing: "ease-in-out" }));
  }
  for (const node of container.querySelectorAll("[data-arrival]")) {
    running.push(node.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 650 }));
  }
  const copy = snapshot.guide.copy;
  if (!copy || copy.from === copy.to) return;
  const from = old.get(copy.from);
  const target = container.querySelector(`[data-anchor="${copy.to}"]`);
  if (!from || !target) return;
  const to = target.getBoundingClientRect(), bounds = container.getBoundingClientRect();
  const token = document.createElement("span");
  token.className = "guided-flight";
  token.textContent = copy.text;
  token.setAttribute("aria-hidden", "true");
  Object.assign(token.style, { left: `${from.left - bounds.left + container.scrollLeft}px`, top: `${from.top - bounds.top + container.scrollTop}px`, width: `${from.width}px`, height: `${from.height}px` });
  container.append(token);
  const targetValue = target.querySelector(".guide-value");
  if (targetValue) targetValue.style.visibility = "hidden";
  const animation = token.animate([{ transform: "translate(0, 0)", opacity: 1 }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px)`, opacity: 1 }], { duration: 850, easing: "ease-in-out" });
  running.push(animation);
  const finish = () => { token.remove(); if (targetValue) targetValue.style.visibility = ""; };
  animation.finished.then(finish, finish);
}
