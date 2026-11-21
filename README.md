# CodeStories

CodeStories is a single-page learning app: choose a study set, follow animated algorithm stories, and practice through the top-page Learn, Quiz, and Flashcards links.

**Live:** <https://codestories-eight.vercel.app>

## Run

Serve the project over HTTP; native modules do not support opening `index.html` directly:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173>.

## Deploy to Vercel

```bash
npm run build
vercel --prod
```

Vercel serves only `dist/`: the HTML, CSS, browser entrypoint, and lesson modules. Tests, planning documents, and other repository files are excluded from deployment uploads. The hash-based lesson URLs require no server-side rewrites.

## Development checks

```bash
npm run test:unit
npm run test:e2e
```

Playwright is development-only. Its Chromium browser may need one-time installation:

```bash
npx playwright install chromium
```

## Scope

- All 75 problems have original stories, real algorithm-driven animations, worked examples, another input case, an algorithm outline, and complexity notes
- Search by title, number, pattern, topic, or company; combine coding-pattern, topic, and company dropdowns on the landing page, and reset them together
- Selecting a topic narrows coding-pattern options, preserves a compatible selection, and automatically selects the sole related pattern. Topics with multiple approaches show all their related patterns rather than forcing a false one-to-one hierarchy
- A Learn → Quiz → Flashcards guide operates on the currently filtered stories. Explicitly mark a story learned, resume the next story, answer and retry questions, or reveal and remember flashcards
- Filters, learned markers, checked quiz answers, flashcard recall, and practice positions persist in browser-local storage. Quiz/flashcard answers stay hidden until revealed or previously checked; no data is sent to a server
- Reset this study set asks for confirmation and clears only the selected stories' learning/practice progress and paused walkthroughs; other stories, filters, and unrelated browser storage remain untouched
- Stories are ordered by the curated 16 Grokking-inspired patterns, with Additional techniques for honest mappings outside them
- Company tags are historical community reports with per-company source links, not verified current interview lists or hiring predictions
- Quizzes and flashcards have independent opt-in toggles, both off by default; opting out removes their questions and answers from the page
- Array/pointer, stack/queue, heap, bit, matrix/DP, linked-list, tree, graph, and trie state visualizations
- **Maximum Average Subarray I** (643): fixed-window sums and bounded custom inputs
- **Move Zeroes** (283): stable read/write-pointer compaction and bounded custom inputs
- **Maximum Depth of Binary Tree** (104): recursive child-depth returns and four tree presets
- **Image feed read path**: metadata-cache hit/miss/unavailable and CDN hit/miss, with separate metadata and image-byte paths
- Accessible 2D walkthroughs with paused step navigation, replay, a clickable timeline, and reduced-motion support
- Browser-local paused position and example/input; learned markers and remembered cards are self-reported, not a mastery claim. No accounts, backend, analytics, or spaced-repetition scheduling

Every animation records actual solver decisions and copies its state so stepping backward does not expose later mutations. The other stories use curated bounded presets rather than unrestricted input editors. The simple interface does not load the earlier optional 3D module.

The catalog follows the public DesignGurus listing; official study-plan access returned HTTP 403 during membership verification. The classic taxonomy is curated, not the complete current Grokking course. NeetCode's videos supplement the original written stories; videos are not embedded or copied.

## Sources & credits

- [Designed to Scale — Dilum Sanjaya](https://designed-to-scale.vercel.app/#/): visual and interaction inspiration
- [DesignGurus — Arslan Ahmad](https://www.designgurus.io/blog/leetcode-75): public LeetCode 75 catalog reference
- [DesignGurus pattern guide](https://www.designgurus.io/blog/top-lc-patterns): pattern reference; the current guide includes 20 patterns
- [LeetCode](https://leetcode.com/studyplan/leetcode-75/): original problems and official study plan
- [NeetCode — Leetcode BLIND-75 Solutions](https://www.youtube.com/playlist?list=PLot-Xpze53ldVwtstag2TL4HQhAnC8ATf): supplemental **Blind 75** videos, not the same problem set as **LeetCode 75**
- [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems/tree/2b71796266751b4736a7ef180efb6847879166ee): factual problem/company associations matched by LeetCode URL from `5. All.csv` files at this pinned snapshot, accessed November 21, 2026. The repository describes these as LeetCode company tags, but direct LeetCode verification returned HTTP 403. Its README and repository description give differing update dates; no current recency or frequency claims are made. All 75 problems have at least one reported association; absence of an association is not evidence a company never asks a question.

All teaching prose, illustrative examples, algorithm code, and diagrams are original. Teaching references are linked, not reproduced. Only factual company associations are imported from the public dataset; no solutions, transcripts, or frequency data are copied. No affiliation or endorsement is implied. Audio, embedded video, user-submitted code execution, and new 3D scenes are out of scope.
