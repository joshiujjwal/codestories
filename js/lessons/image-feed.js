export const imageFeedLesson = {
  id: "image-feed-read",
  title: "Image feed: a read request",
  pattern: "System Design",
  outcome: "Trace metadata and image delivery separately, then explain a cache decision.",
  cards: [
    ["What does the Timeline DB store here?", "Feed metadata: posts and image references."],
    ["What does object storage hold?", "The actual image bytes."],
    ["Is the cache the source of truth?", "No. It is a fast copy of metadata."],
    ["What happens on a cache miss?", "The service reads the Timeline DB, then refreshes the cache."],
    ["What happens when cache is unavailable?", "The service bypasses it and reads the healthy database."],
    ["What does a CDN hit avoid?", "A request to object storage."]
  ],
  questions: [
    { prompt: "Which store is durable source of truth for feed metadata?", choices: ["Timeline DB", "Metadata cache"], answer: 0, explanation: "The cache is a fast copy; the Timeline DB holds durable metadata." },
    { prompt: "After a metadata cache miss, what should the feed service do?", choices: ["Read Timeline DB", "Return cached metadata"], answer: 0, explanation: "A miss means there is no usable cached metadata to return." },
    { prompt: "What does a CDN hit avoid?", choices: ["Object storage", "The reader"], answer: 0, explanation: "The CDN can serve already-cached image bytes without an origin request." },
    { prompt: "If metadata cache is unavailable and the CDN misses, what is true?", choices: ["Timeline DB and object storage are both contacted.", "No durable store is contacted."], answer: 0, explanation: "This lesson assumes both durable stores are healthy, so each layer takes its degraded or origin route." }
  ]
};

const event = (from, to, label, kind = "request") => ({ from, to, label, kind });

export function buildImageFeedTrace({ metadata = "miss", media = "miss" } = {}) {
  if (!["hit", "miss", "unavailable"].includes(metadata) || !["hit", "miss"].includes(media)) {
    throw new Error("Unknown image-feed scenario.");
  }
  const events = [
    event("reader", "gateway", "GET /feed"),
    event("gateway", "feed-service", "authorized request"),
    event("feed-service", "metadata-cache", "find timeline")
  ];

  if (metadata === "hit") {
    events.push(event("metadata-cache", "feed-service", "cached timeline", "response"));
  } else if (metadata === "miss") {
    events.push(event("metadata-cache", "feed-service", "not found", "response"));
    events.push(event("feed-service", "timeline-db", "read timeline"));
    events.push(event("timeline-db", "feed-service", "timeline metadata", "response"));
    events.push(event("feed-service", "metadata-cache", "store metadata", "populate-cache"));
  } else {
    events.push(event("metadata-cache", "feed-service", "unavailable", "unavailable"));
    events.push(event("feed-service", "timeline-db", "degraded read"));
    events.push(event("timeline-db", "feed-service", "timeline metadata", "response"));
  }

  events.push(
    event("feed-service", "gateway", "feed references", "response"),
    event("gateway", "reader", "feed response", "response"),
    event("reader", "cdn", "GET image"),
  );
  if (media === "hit") {
    events.push(event("cdn", "reader", "image bytes", "response"));
  } else {
    events.push(
      event("cdn", "object-storage", "fetch image"),
      event("object-storage", "cdn", "image bytes", "response"),
      event("cdn", "reader", "image bytes", "response")
    );
  }

  return {
    events,
    snapshots: events.map((current, index) => ({
      id: `event-${index}`,
      phase: `${current.kind === "response" ? "Return" : "Request"}: ${current.label}`,
      summary: `${labelFor(current.from)} → ${labelFor(current.to)}: ${current.label}.`,
      state: { metadata, media, current, eventIndex: index },
      code: ""
    }))
  };
}

function labelFor(id) {
  return id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}
