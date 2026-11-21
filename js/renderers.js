export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

export function renderDiagram(renderer, snapshot) {
  if (renderer === "story") return renderStoryState(snapshot);
  const state = snapshot.state;
  if (renderer === "window" || renderer === "move") {
    const window = renderer === "window";
    const note = window
      ? `Fixed window: ${state.k} values · current sum ${state.sum} · best sum ${state.bestSum}`
      : `Read: ${state.read ?? "done"} · write: ${state.write} · retained: ${state.write}${state.complete ? " · complete" : ""}`;
    const cells = state.values.map((value, index) => {
      const active = window ? index >= state.start && index <= state.end : index === state.read;
      const kept = window ? index >= state.bestStart && index < state.bestStart + state.k : index < state.write;
      const pointer = window ? (index === state.start ? "L" : "") + (index === state.end ? " R" : "") : [index === state.read ? "read" : "", index === state.write ? "write" : ""].filter(Boolean).join(" / ");
      return `<div class="array-cell ${active ? "active" : ""} ${kept ? "best" : ""}" aria-label="Index ${index}, value ${value}${pointer ? `, ${pointer}` : ""}${kept ? ", retained or best" : ""}"><span class="pointer">${pointer}</span>${value}<small>i ${index}</small></div>`;
    }).join("");
    return `<p class="scene-note">${note}</p><div class="array-scroll"><div class="array-scene">${cells || '<p class="empty-state">Empty array · nothing to move.</p>'}</div></div><p class="scene-legend">${window ? "Yellow: current window · green outline: best window" : "Yellow: read position · green outline: retained prefix"}</p>`;
  }
  if (renderer === "tree") {
    const positions = new Map(state.nodes.map((node) => {
      let x = 300;
      [...node.id.slice(4)].forEach((direction, index) => { x += (direction === "L" ? -1 : 1) * (140 / 2 ** index); });
      return [node.id, { x, y: 40 + node.level * 65 }];
    }));
    const edges = state.nodes.filter((node) => node.parent).map((node) => {
      const from = positions.get(node.parent);
      const to = positions.get(node.id);
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="tree-edge" />`;
    }).join("");
    const nodes = state.nodes.map((node) => {
      const { x, y } = positions.get(node.id);
      const depth = state.returned[node.id];
      return `<g class="tree-node ${node.id === state.active ? "active" : ""}" transform="translate(${x} ${y})"><title>Node ${node.value}${depth === undefined ? "" : `, returned depth ${depth}`}</title><circle r="20" /><text text-anchor="middle" dy="5">${node.value}</text>${depth === undefined ? "" : `<text class="depth-label" text-anchor="middle" y="35">depth ${depth}</text>`}</g>`;
    }).join("");
    const frames = state.stack.map((id) => {
      const node = state.nodes.find((item) => item.id === id);
      return node ? node.value : "empty";
    });
    const xs = [...positions.values()].map(({ x }) => x);
    const width = xs.length ? Math.max(180, Math.max(...xs) - Math.min(...xs) + 90) : 400;
    const left = xs.length ? (Math.min(...xs) + Math.max(...xs) - width) / 2 : 100;
    const height = state.nodes.length ? Math.max(180, 105 + Math.max(...state.nodes.map((node) => node.level)) * 65) : 240;
    return `<p class="scene-note">Recursion frames: ${frames.join(" → ") || "returned"}</p><svg class="tree-diagram" viewBox="${left} 0 ${width} ${height}" role="img" aria-label="Binary tree and returned subtree depths"><title>${escapeHTML(snapshot.summary)}</title>${edges}${nodes}${state.nodes.length ? "" : '<text x="300" y="120" text-anchor="middle">Empty tree · depth 0</text>'}</svg>`;
  }
  const active = new Set([state.current.from, state.current.to]);
  const nodes = [["reader", "Reader", "asks for feed"], ["gateway", "Gateway", "auth + limit"], ["feed-service", "Feed service", "chooses route"], ["metadata-cache", "Metadata cache", "fast copy"], ["timeline-db", "Timeline DB", "durable metadata"], ["cdn", "CDN", "image delivery"], ["object-storage", "Object storage", "image bytes"]];
  return `<div class="system-scene">${nodes.map(([id, label, detail]) => `<div class="system-node ${id.replace("feed-service", "service").replace("metadata-cache", "cache").replace("timeline-db", "database").replace("object-storage", "storage")} ${active.has(id) ? "active" : ""}"><b>${label}</b><small>${detail}</small></div>`).join("")}<p class="event-text">${escapeHTML(snapshot.summary)}</p></div>`;
}

function display(value) {
  if (value === null) return "null";
  if (value === "") return "empty";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function renderStoryState(snapshot) {
  const state = snapshot.state;
  const arrayRows = Object.entries(state.arrays ?? {}).map(([name, values]) => `<section class="state-array"><h4>${escapeHTML(name)}</h4><div class="state-array-scroll"><div class="state-cells">${values.map((value, index) => {
    const active = state.active?.[name]?.includes(index);
    return `<div class="state-cell ${active ? "active" : ""}" aria-label="${escapeHTML(name)}, index ${index}, ${escapeHTML(display(value))}${active ? ", active" : ""}">${escapeHTML(display(value))}<small>${index}</small></div>`;
  }).join("") || '<span class="empty-data">empty</span>'}</div></div></section>`).join("");
  const grid = state.grid ? `<div class="state-grid-scroll"><table class="state-grid"><caption>State table · row / column</caption><tbody>${state.grid.map((row, r) => `<tr>${row.map((value, c) => {
    const active = state.activeGrid?.some(([row, col]) => row === r && col === c);
    return `<td class="${active ? "active" : ""}" aria-label="Row ${r}, column ${c}, ${escapeHTML(display(value))}${active ? ", active" : ""}">${escapeHTML(display(value))}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>` : "";
  const vars = Object.entries(state.vars ?? {}).map(([name, value]) => `<div><span>${escapeHTML(name)}</span><strong>${escapeHTML(display(value))}</strong></div>`).join("");
  const output = Object.hasOwn(state, "output") ? `<p class="result-output"><b>Result</b> <span>${escapeHTML(display(state.output))}</span></p>` : "";
  return `<div class="story-state">${state.graph ? renderGraph(state.graph, state.activeNodes ?? [], snapshot.summary) : ""}${grid}${arrayRows}${vars ? `<div class="state-vars">${vars}</div>` : ""}${output}<p class="state-legend">Highlighted cells or nodes show this step's focus. Every state comes from the algorithm's actual execution.</p></div>`;
}

function renderGraph(graph, active, summary) {
  const nodes = graph.nodes.map((node, index) => ({
    ...node,
    x: node.x ?? 260 + Math.cos(2 * Math.PI * index / Math.max(1, graph.nodes.length) - Math.PI / 2) * 140,
    y: node.y ?? 150 + Math.sin(2 * Math.PI * index / Math.max(1, graph.nodes.length) - Math.PI / 2) * 100
  }));
  const positions = new Map(nodes.map((node) => [node.id, node]));
  const paths = graph.edges.map(([from, to]) => {
    const a = positions.get(from), b = positions.get(to);
    if (!a || !b) throw new Error("A story edge references a missing node.");
    const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const x1 = a.x + 23 * (b.x - a.x) / distance, y1 = a.y + 23 * (b.y - a.y) / distance;
    const x2 = b.x - 27 * (b.x - a.x) / distance, y2 = b.y - 27 * (b.y - a.y) / distance;
    const curve = graph.kind === "list" ? `Q ${(x1 + x2) / 2} ${a.y - 45} ${x2} ${y2}` : `L ${x2} ${y2}`;
    return `<path d="M ${x1} ${y1} ${curve}" marker-end="url(#storyArrow)" class="story-edge" />`;
  }).join("");
  const xs = nodes.map((node) => node.x), ys = nodes.map((node) => node.y);
  const width = xs.length ? Math.max(200, Math.max(...xs) - Math.min(...xs) + 100) : 300;
  const height = ys.length ? Math.max(160, Math.max(...ys) - Math.min(...ys) + 110) : 180;
  const left = xs.length ? (Math.min(...xs) + Math.max(...xs) - width) / 2 : 0;
  const top = ys.length ? (Math.min(...ys) + Math.max(...ys) - height) / 2 : 0;
  return `<svg class="story-graph" viewBox="${left} ${top} ${width} ${height}" role="img" aria-label="Algorithm nodes and links"><title>${escapeHTML(summary)}</title><defs><marker id="storyArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="#7e9279" /></marker></defs>${paths}${nodes.map((node) => `<g class="story-node ${active.includes(node.id) ? "active" : ""}" transform="translate(${node.x}, ${node.y})"><circle r="22" /><text text-anchor="middle" dy="4">${escapeHTML(display(node.label))}</text><title>Node ${escapeHTML(display(node.label))}${active.includes(node.id) ? ", active" : ""}</title></g>`).join("")}${nodes.length ? "" : `<text x="${left + width / 2}" y="${top + height / 2}" text-anchor="middle">Empty structure</text>`}</svg>`;
}

export function conceptFor(renderer, snapshot) {
  const state = snapshot.state;
  if (renderer === "window") return state.outgoing === null
    ? `Invariant: every completed window contains exactly ${state.k} adjacent values.`
    : `Remove ${state.outgoing}, add ${state.incoming}. The ${state.k - 1} overlapping values stay counted.`;
  if (renderer === "move") return "Invariant: indexes before write contain the nonzeros already seen, in their original order. The suffix is unfinished until zero filling.";
  if (renderer === "tree") return "Invariant: each returned depth counts nodes in that subtree's longest path. An empty child returns 0; a parent adds itself once.";
  if (state.current.kind === "unavailable") return "The cache is unavailable, but the Timeline DB is assumed healthy.";
  return state.metadata === "hit" ? "A metadata cache hit avoids the Timeline DB; the cache is not the source of truth." : "Feed metadata and image bytes travel through different stores and paths.";
}
