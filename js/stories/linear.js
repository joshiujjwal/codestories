export const linearStories = [
  {
    id: 1768, cases: [[{ a: "sun", b: "maple" }, "smuanple"], [{ a: "", b: "ink" }, "ink"]],
    goal: "Two words take turns donating characters to one new word. Keep any tail when one runs out.",
    idea: "Position i supplies at most one character from each word; the output preserves both words' order.",
    trap: "Stopping when the shorter word ends loses the longer word's tail.", cost: "O(m + n) time and output space.",
    code: "for each position i up to the longer length:\n  append a[i] if it exists\n  append b[i] if it exists",
    run({ a, b }, step) {
      let output = "";
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        output += (a[i] ?? "") + (b[i] ?? "");
        step("Take a turn", `Position ${i} contributes ${a[i] ?? "no character"} and ${b[i] ?? "no character"}.`, { arrays: { a: [...a], b: [...b], output: [...output] }, active: { a: [i], b: [i] } });
      }
      return output;
    }
  },
  {
    id: 1071, cases: [[{ a: "TATATA", b: "TATA" }, "TA"], [{ a: "AB", b: "AC" }, ""]],
    goal: "Find the longest block that can repeat to build both strings.",
    idea: "Compatible repeated strings commute when concatenated. Their shared block length is the gcd of their lengths.",
    trap: "A common starting character is not enough: the entire repetition must match.", cost: "O(m + n) time and concatenation space.",
    code: "if a + b != b + a: return empty\nx = length(a); y = length(b)\nwhile y != 0: (x, y) = (y, x % y)\nreturn a.slice(0, x)",
    run({ a, b }, step) {
      const compatible = a + b === b + a;
      step("Check repetition", compatible ? "Both concatenation orders agree." : "The two concatenations disagree; no repeated block fits.", { arrays: { "a + b": [...(a + b)], "b + a": [...(b + a)] }, vars: { compatible } });
      if (!compatible) return "";
      let x = a.length, y = b.length;
      while (y) {
        [x, y] = [y, x % y];
        step("Reduce the lengths", `Euclid's remainder step leaves lengths ${x} and ${y}.`, { vars: { x, y } }, 2);
      }
      return a.slice(0, x);
    }
  },
  {
    id: 1431, cases: [[{ nums: [3, 7, 5], extra: 2 }, [false, true, true]], [{ nums: [4], extra: 0 }, [true]]],
    goal: "For each child, ask whether giving them all the extra candies would reach the current maximum.",
    idea: "Find the maximum once, then compare each hypothetical total independently.",
    trap: "The extra candies are tested separately for each child, not shared across all children.", cost: "O(n) time; O(n) output, O(1) auxiliary space.",
    code: "maximum = max(candies)\nfor each candy count:\n  answer = count + extra >= maximum",
    run({ nums, extra }, step) {
      const maximum = Math.max(...nums), output = [];
      step("Set the target", `The current maximum is ${maximum}.`, { arrays: { candies: nums }, vars: { maximum, extra } });
      nums.forEach((value, i) => {
        output.push(value + extra >= maximum);
        step("Try one gift", `${value} + ${extra} ${output[i] ? "reaches" : "does not reach"} ${maximum}.`, { arrays: { candies: nums, answers: output }, active: { candies: [i] } }, 2);
      });
      return output;
    }
  },
  {
    id: 605, cases: [[{ nums: [0, 0, 0, 0, 0], n: 2 }, true], [{ nums: [1, 0, 1], n: 1 }, false]],
    goal: "Plant the requested number of flowers without making any two flowers adjacent.",
    idea: "A greedy placement is safe at the earliest empty plot with empty neighbors; mark the placement before advancing.",
    trap: "Checking the original neighbors after a placement would allow adjacent new flowers.", cost: "O(n) time and O(1) solver space; the walkthrough copies its input.",
    code: "for each plot i:\n  if plot and both neighbors are empty:\n    plant at i; decrement remaining\nreturn remaining <= 0",
    run({ nums, n }, step) {
      for (let i = 0; i < nums.length && n > 0; i++) {
        const safe = !nums[i] && !nums[i - 1] && !nums[i + 1];
        if (safe) { nums[i] = 1; n--; }
        step(safe ? "Plant here" : "Leave this plot", safe ? `Plot ${i} is isolated; ${n} more flowers are needed.` : `Plot ${i} is occupied or touches a flower.`, { arrays: { plots: nums }, active: { plots: [i] }, vars: { remaining: n } }, 1);
      }
      return n <= 0;
    }
  },
  {
    id: 345, cases: [[{ text: "garden" }, "gerdan"], [{ text: "sky" }, "sky"]],
    goal: "Reverse only the vowels, leaving every consonant in its original position.",
    idea: "Two pointers skip nonvowels and exchange the next pair of vowels from opposite ends.",
    trap: "Reversing the whole string moves consonants too.", cost: "O(n) time and O(n) space for JavaScript's mutable character copy.",
    code: "left = 0; right = last index\nskip nonvowels from both sides\nswap vowels; move both pointers inward",
    run({ text }, step) {
      const chars = [...text], vowels = new Set("aeiouAEIOU");
      let left = 0, right = chars.length - 1;
      while (left < right) {
        if (!vowels.has(chars[left])) left++;
        else if (!vowels.has(chars[right])) right--;
        else { [chars[left], chars[right]] = [chars[right], chars[left]]; left++; right--; }
        step("Find the next vowel pair", `The remaining search is between ${left} and ${right}.`, { arrays: { characters: chars }, active: { characters: [left, right] }, vars: { left, right } }, 1);
      }
      return chars.join("");
    }
  },
  {
    id: 151, cases: [[{ text: "  read  one story " }, "story one read"], [{ text: "hello" }, "hello"]],
    goal: "Reverse the order of words and normalize the spaces between them.",
    idea: "Identify complete words, reverse their order, then join them with one space.",
    trap: "Reversing individual letters produces reversed words, not reversed word order.", cost: "O(n) time and O(n) space.",
    code: "words = trim(text).split(on runs of spaces)\nreverse(words)\nreturn words.join(one space)",
    run({ text }, step) {
      const words = text.trim() ? text.trim().split(/\s+/) : [];
      step("Separate the words", "Whitespace is a separator, not part of a word.", { arrays: { words } });
      let left = 0, right = words.length - 1;
      while (left < right) {
        [words[left], words[right]] = [words[right], words[left]];
        step("Exchange word positions", `Swap positions ${left} and ${right}.`, { arrays: { words }, active: { words: [left, right] } }, 1);
        left++; right--;
      }
      return words.join(" ");
    }
  },
  {
    id: 238, cases: [[{ nums: [2, 3, 4, 5] }, [60, 40, 30, 24]], [{ nums: [0, 2, 0] }, [0, 0, 0]]],
    goal: "For each position, multiply every value except the one at that position, without division.",
    idea: "Store the product strictly to the left, then multiply it by a running product strictly to the right.",
    trap: "Dividing a total product fails when the input contains zero.", cost: "O(n) time; O(n) output and O(1) auxiliary space.",
    code: "prefix = 1\nfor i left to right: out[i] = prefix; prefix *= nums[i]\nsuffix = 1\nfor i right to left: out[i] *= suffix; suffix *= nums[i]",
    run({ nums }, step) {
      const output = Array(nums.length).fill(1);
      let product = 1;
      for (let i = 0; i < nums.length; i++) {
        output[i] = product; product *= nums[i];
        step("Collect the left product", `Index ${i} stores the product of values before it.`, { arrays: { input: nums, output }, active: { input: [i], output: [i] }, vars: { prefix: product } }, 1);
      }
      product = 1;
      for (let i = nums.length - 1; i >= 0; i--) {
        output[i] *= product; product *= nums[i];
        step("Add the right product", `Index ${i} now excludes only its own value.`, { arrays: { input: nums, output }, active: { output: [i] }, vars: { suffix: product } }, 3);
      }
      return output;
    }
  },
  {
    id: 334, cases: [[{ nums: [5, 1, 4, 2, 3] }, true], [{ nums: [3, 2, 1] }, false]],
    goal: "Detect three increasing values that appear in increasing index order.",
    idea: "Keep the smallest first candidate and the smallest second candidate supported by an earlier first.",
    trap: "Equality does not extend a strictly increasing triplet.", cost: "O(n) time and O(1) space.",
    code: "first = infinity; second = infinity\nfor x:\n  if x <= first: first = x\n  else if x <= second: second = x\n  else: return true",
    run({ nums }, step) {
      let first = Infinity, second = Infinity;
      for (let i = 0; i < nums.length; i++) {
        const x = nums[i], found = x > second;
        if (x <= first) first = x;
        else if (x <= second) second = x;
        step(found ? "A third value fits" : "Improve a candidate", `After ${x}, first is ${first}, second is ${second}.`, { arrays: { input: nums }, active: { input: [i] }, vars: { first: Number.isFinite(first) ? first : "∞", second: Number.isFinite(second) ? second : "∞" } }, found ? 4 : 2);
        if (found) return true;
      }
      return false;
    }
  },
  {
    id: 443, cases: [[{ chars: ["b", "b", "b", "c", "c", "d"] }, { length: 5, chars: ["b", "3", "c", "2", "d"] }], [{ chars: ["x"] }, { length: 1, chars: ["x"] }]],
    goal: "Rewrite runs as a character followed by its count, omitting the count for a single character.",
    idea: "Read an entire run before writing its compact form; the write pointer never overtakes unread input.",
    trap: "A multi-digit count needs one output character per digit.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "read = write = 0\nmeasure the run starting at read\nwrite the character and count digits if count > 1\nreturn write",
    run({ chars }, step) {
      let read = 0, write = 0;
      while (read < chars.length) {
        const character = chars[read];
        let end = read + 1;
        while (end < chars.length && chars[end] === character) end++;
        const count = end - read;
        chars[write++] = character;
        if (count > 1) for (const digit of String(count)) chars[write++] = digit;
        step("Write a run", `${count} copies of ${character} become ${character}${count > 1 ? count : ""}. Only the prefix before write is output.`, { arrays: { buffer: chars, compressed: chars.slice(0, write) }, active: { buffer: [read, end - 1] }, vars: { read, write, count } }, 2);
        read = end;
      }
      return { length: write, chars: chars.slice(0, write) };
    }
  },
  {
    id: 392, cases: [[{ s: "cat", t: "cobalt" }, true], [{ s: "ac", t: "ca" }, false]],
    goal: "Check whether the small string appears in order inside the larger string, possibly with gaps.",
    idea: "Advance the small-string pointer only on a match; scan the larger string once.",
    trap: "Membership alone ignores order, which a subsequence must preserve.", cost: "O(|t|) time and O(1) space.",
    code: "matched = 0\nfor each character in t:\n  if it matches s[matched]: matched++\nreturn matched == length(s)",
    run({ s, t }, step) {
      let matched = 0;
      for (let i = 0; i < t.length; i++) {
        if (s[matched] === t[i]) matched++;
        step("Scan the larger string", `${matched} of ${s.length} required characters have matched in order.`, { arrays: { subsequence: [...s], text: [...t] }, active: { text: [i], subsequence: [matched] }, vars: { matched } }, 2);
      }
      return matched === s.length;
    }
  },
  {
    id: 11, cases: [[{ nums: [2, 7, 3, 6, 4] }, 12], [{ nums: [5, 5] }, 5]],
    goal: "Choose two vertical lines that hold the greatest area of water.",
    idea: "Area is width times the shorter height. Moving the taller side cannot improve the current limiting height.",
    trap: "The tallest individual line does not necessarily belong to the best container.", cost: "O(n) time and O(1) space.",
    code: "left = 0; right = last; best = 0\nbest = max(best, min(height[left], height[right]) * width)\nmove the shorter side inward; repeat",
    run({ nums }, step) {
      let left = 0, right = nums.length - 1, best = 0;
      while (left < right) {
        const area = Math.min(nums[left], nums[right]) * (right - left);
        best = Math.max(best, area);
        step("Measure this container", `Width ${right - left} × limiting height ${Math.min(nums[left], nums[right])} = ${area}.`, { arrays: { heights: nums }, active: { heights: [left, right] }, vars: { area, best } }, 1);
        if (nums[left] <= nums[right]) left++; else right--;
      }
      return best;
    }
  },
  {
    id: 1679, cases: [[{ nums: [1, 5, 3, 3, 2, 4], k: 6 }, 3], [{ nums: [1, 1, 1], k: 2 }, 1]],
    goal: "Remove as many disjoint pairs as possible whose values add to the target.",
    idea: "After sorting, a small sum advances the left side; a large sum retreats the right side; a match consumes both.",
    trap: "A value cannot be reused in another pair after it has been consumed.", cost: "O(n log n) time; sorting space depends on the implementation.",
    code: "sort nums\ncompare nums[left] + nums[right] with k\nmove one boundary, or consume both on a match",
    run({ nums, k }, step) {
      nums.sort((a, b) => a - b);
      let left = 0, right = nums.length - 1, pairs = 0;
      while (left < right) {
        const sum = nums[left] + nums[right];
        step("Compare the boundary pair", `${nums[left]} + ${nums[right]} = ${sum}; target ${k}.`, { arrays: { sorted: nums }, active: { sorted: [left, right] }, vars: { pairs, sum, target: k } }, 1);
        if (sum === k) { pairs++; left++; right--; }
        else if (sum < k) left++; else right--;
      }
      return pairs;
    }
  },
  {
    id: 1456, cases: [[{ text: "aeobxcd", k: 3 }, 3], [{ text: "rhythm", k: 2 }, 0]],
    goal: "Find the most vowels in any contiguous substring of the requested length.",
    idea: "A fixed window keeps a vowel count; subtract the departing character and add the arriving one.",
    trap: "The window must have exactly k characters, not just contain k vowels.", cost: "O(n) time and O(1) auxiliary space.",
    code: "for right across the string:\n  count += isVowel(text[right])\n  if right >= k: count -= isVowel(text[right-k])\n  if window is full: update best",
    run({ text, k }, step) {
      const vowels = new Set("aeiou");
      let count = 0, best = 0;
      for (let right = 0; right < text.length; right++) {
        count += Number(vowels.has(text[right]));
        if (right >= k) count -= Number(vowels.has(text[right - k]));
        if (right >= k - 1) best = Math.max(best, count);
        step("Slide the vowel counter", `The current range has ${count} vowels; best full-window count is ${best}.`, { arrays: { text: [...text] }, active: { text: Array.from({ length: Math.min(k, right + 1) }, (_, i) => Math.max(0, right - k + 1) + i) }, vars: { count, best, k } }, 2);
      }
      return best;
    }
  },
  {
    id: 1004, cases: [[{ nums: [1, 0, 1, 1, 0, 1], k: 1 }, 4], [{ nums: [0, 0], k: 0 }, 0]],
    goal: "Find the longest contiguous run that could become all ones with at most k zero flips.",
    idea: "Expand right, then shrink left until the zero count fits the budget.",
    trap: "Counting ones without counting zeros ignores the cost of connecting them.", cost: "O(n) time and O(1) space.",
    code: "expand right and count zeros\nwhile zeros > k: remove nums[left++] from the count\nbest = max(best, right-left+1)",
    run({ nums, k }, step) {
      let left = 0, zeros = 0, best = 0;
      for (let right = 0; right < nums.length; right++) {
        if (!nums[right]) zeros++;
        while (zeros > k) { if (!nums[left]) zeros--; left++; }
        best = Math.max(best, right - left + 1);
        step("Restore the flip budget", `Range ${left}..${right} needs ${zeros} flips and has length ${right - left + 1}.`, { arrays: { bits: nums }, active: { bits: Array.from({ length: right - left + 1 }, (_, i) => left + i) }, vars: { zeros, budget: k, best } }, 1);
      }
      return best;
    }
  },
  {
    id: 1493, cases: [[{ nums: [1, 1, 0, 1, 1] }, 4], [{ nums: [1, 1, 1] }, 2]],
    goal: "Delete exactly one element and maximize the contiguous ones remaining.",
    idea: "Keep at most one zero in a window; subtract one from its length because a deletion is mandatory.",
    trap: "An all-ones array still loses one element.", cost: "O(n) time and O(1) space.",
    code: "expand a window with at most one zero\nshrink when a second zero arrives\nbest = max(best, window length - 1)",
    run({ nums }, step) {
      let left = 0, zeros = 0, best = 0;
      for (let right = 0; right < nums.length; right++) {
        if (!nums[right]) zeros++;
        while (zeros > 1) { if (!nums[left]) zeros--; left++; }
        best = Math.max(best, right - left);
        step("Reserve the deletion", `This ${right - left + 1}-element range contributes ${right - left} after one deletion.`, { arrays: { bits: nums }, active: { bits: Array.from({ length: right - left + 1 }, (_, i) => left + i) }, vars: { zeros, best } }, 2);
      }
      return best;
    }
  },
  {
    id: 1732, cases: [[{ gains: [-3, 5, -1, 2] }, 3], [{ gains: [-2, -1] }, 0]],
    goal: "Follow altitude changes from sea level and report the highest point reached.",
    idea: "A running sum is the current altitude; include the starting altitude zero in the maximum.",
    trap: "Looking only at individual gains misses accumulated altitude.", cost: "O(n) time and O(1) space.",
    code: "altitude = highest = 0\nfor gain: altitude += gain; highest = max(highest, altitude)",
    run({ gains }, step) {
      let altitude = 0, highest = 0;
      gains.forEach((gain, i) => {
        altitude += gain; highest = Math.max(highest, altitude);
        step("Climb or descend", `Change ${gain} brings the altitude to ${altitude}.`, { arrays: { gains }, active: { gains: [i] }, vars: { altitude, highest } }, 1);
      });
      return highest;
    }
  },
  {
    id: 724, cases: [[{ nums: [2, 3, 1, 6, 6] }, 3], [{ nums: [1, 2, 3] }, -1]],
    goal: "Find the first index whose left and right sums balance, excluding the indexed value itself.",
    idea: "Right sum is total minus left sum minus the current value.",
    trap: "Including the pivot in either side changes the balance equation.", cost: "O(n) time and O(1) space.",
    code: "total = sum(nums); left = 0\nfor i: right = total - left - nums[i]\n  if left == right: return i\n  left += nums[i]\nreturn -1",
    run({ nums }, step) {
      const total = nums.reduce((a, b) => a + b, 0);
      let left = 0;
      for (let i = 0; i < nums.length; i++) {
        const right = total - left - nums[i];
        step("Test the balance", `At index ${i}, left sum ${left} compares with right sum ${right}.`, { arrays: { input: nums }, active: { input: [i] }, vars: { left, right, total } }, 1);
        if (left === right) return i;
        left += nums[i];
      }
      return -1;
    }
  },
  {
    id: 2215, cases: [[{ a: [1, 4, 4], b: [2, 4, 6] }, [[1], [2, 6]]], [{ a: [2], b: [2] }, [[], []]]],
    goal: "List distinct values belonging only to the first array and only to the second.",
    idea: "Sets remove duplicates and provide membership tests against the opposite side.",
    trap: "Repeated occurrences must not appear repeatedly in the answer.", cost: "O(m + n) expected time and O(m + n) space.",
    code: "A = set(a); B = set(b)\ncollect x in A when x not in B\ncollect x in B when x not in A",
    run({ a, b }, step) {
      const A = new Set(a), B = new Set(b), output = [[], []];
      for (const [side, own, other] of [[0, A, B], [1, B, A]]) for (const value of own) {
        if (!other.has(value)) output[side].push(value);
        step("Check the other set", `${value} is ${other.has(value) ? "shared" : "unique to this side"}.`, { arrays: { first: [...A], second: [...B], "first only": output[0], "second only": output[1] }, vars: { value } }, side + 1);
      }
      return output;
    }
  },
  {
    id: 1207, cases: [[{ nums: [4, 4, 1, 1, 1, 2] }, true], [{ nums: [1, 2] }, false]],
    goal: "Check whether each distinct value has a different occurrence count.",
    idea: "Count values first; then detect duplicate frequencies with a second set.",
    trap: "Distinct input values can still have equal frequencies.", cost: "O(n) expected time and O(n) space.",
    code: "count each value in a map\nseenCounts = empty set\nreject any frequency already in seenCounts",
    run({ nums }, step) {
      const counts = new Map();
      nums.forEach((value, i) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
        step("Count an occurrence", `${value} has appeared ${counts.get(value)} times.`, { arrays: { input: nums }, active: { input: [i] }, vars: Object.fromEntries(counts) });
      });
      const seen = new Set();
      for (const count of counts.values()) {
        step("Check a frequency", `Frequency ${count} ${seen.has(count) ? "was already used" : "is new"}.`, { arrays: { frequencies: [...counts.values()], seen: [...seen] }, vars: { count } }, 2);
        if (seen.has(count)) return false;
        seen.add(count);
      }
      return true;
    }
  },
  {
    id: 1657, cases: [[{ a: "aaabbc", b: "bbccca" }, true], [{ a: "aa", b: "ab" }, false]],
    goal: "Decide whether character swaps and exchanges of existing character labels can transform one string into the other.",
    idea: "Both strings need the same character set and the same multiset of character frequencies.",
    trap: "Matching lengths or sorted frequencies alone is insufficient if the character sets differ.", cost: "O(n + k log k) time and O(k) space for k distinct characters.",
    code: "count characters in both strings\ncompare sorted character sets\ncompare sorted frequency lists",
    run({ a, b }, step) {
      const count = (text) => {
        const map = new Map();
        for (const character of text) map.set(character, (map.get(character) ?? 0) + 1);
        return map;
      };
      const A = count(a), B = count(b);
      const keysA = [...A.keys()].sort(), keysB = [...B.keys()].sort();
      step("Compare the alphabets", "Operations can rename existing characters but cannot create a new character.", { arrays: { "first letters": keysA, "second letters": keysB } }, 1);
      const first = [...A.values()].sort((x, y) => x - y), second = [...B.values()].sort((x, y) => x - y);
      step("Compare the frequency shapes", "Renaming can permute frequencies among the same characters.", { arrays: { "first counts": first, "second counts": second } }, 2);
      return JSON.stringify(keysA) === JSON.stringify(keysB) && JSON.stringify(first) === JSON.stringify(second);
    }
  },
  {
    id: 2352, cases: [[{ grid: [[1, 2], [2, 1]] }, 2], [{ grid: [[5]] }, 1]],
    goal: "Count every row-column pair whose values match in the same order.",
    idea: "Hash entire row sequences with frequencies, then look up each column sequence.",
    trap: "Rows and columns with the same values in different orders are not equal.", cost: "O(n²) time and O(n²) signature space.",
    code: "count row signatures\nfor each column:\n  answer += frequency of its signature",
    run({ grid }, step) {
      const rows = new Map();
      grid.forEach((row, i) => {
        const key = JSON.stringify(row);
        rows.set(key, (rows.get(key) ?? 0) + 1);
        step("Store a row signature", `Row ${i} is ${key}. Duplicate rows increase its frequency.`, { grid, activeGrid: row.map((_, col) => [i, col]), vars: Object.fromEntries(rows) });
      });
      let pairs = 0;
      for (let col = 0; col < grid.length; col++) {
        const column = grid.map((row) => row[col]);
        pairs += rows.get(JSON.stringify(column)) ?? 0;
        step("Match a column", `Column ${col} brings the pair count to ${pairs}.`, { grid, activeGrid: grid.map((_, row) => [row, col]), vars: { pairs } }, 2);
      }
      return pairs;
    }
  },
  {
    id: 2390, cases: [[{ text: "code**s" }, "cos"], [{ text: "ab**" }, ""]],
    goal: "A star erases the nearest surviving character to its left.",
    idea: "The latest surviving character is exactly the top of a stack.",
    trap: "Deleting the original previous index fails after earlier stars have already removed characters.", cost: "O(n) time and O(n) space.",
    code: "for character:\n  if star: pop stack\n  else: push character\nreturn join(stack)",
    run({ text }, step) {
      const stack = [];
      [...text].forEach((character, i) => {
        if (character === "*") stack.pop(); else stack.push(character);
        step(character === "*" ? "Undo the latest letter" : "Keep this letter", `After ${character}, the surviving text is ${stack.join("") || "empty"}.`, { arrays: { text: [...text], stack }, active: { text: [i] } }, character === "*" ? 1 : 2);
      });
      return stack.join("");
    }
  },
  {
    id: 735, cases: [[{ nums: [4, 8, -5, -9] }, [-9]], [{ nums: [3, -3] }, []]],
    goal: "Resolve collisions between right-moving and left-moving asteroids; equal sizes destroy each other.",
    idea: "Only a positive stack top and a new negative asteroid can meet. Resolve that pair repeatedly.",
    trap: "Asteroids moving away from each other never collide.", cost: "O(n) time and O(n) space; each asteroid is pushed and popped at most once.",
    code: "for asteroid:\n  while alive and asteroid < 0 and stack.top > 0:\n    resolve sizes; pop smaller positive asteroid\n  if alive: push asteroid",
    run({ nums }, step) {
      const stack = [];
      nums.forEach((value, i) => {
        let alive = true;
        while (alive && value < 0 && stack.at(-1) > 0) {
          const previous = stack.at(-1);
          if (previous <= -value) stack.pop();
          if (previous >= -value) alive = false;
          step("Resolve an approaching pair", `${previous} meets ${value}; ${alive ? "the incoming asteroid continues" : "the incoming asteroid is destroyed"}.`, { arrays: { asteroids: nums, survivors: stack }, active: { asteroids: [i] } }, 2);
        }
        if (alive) stack.push(value);
        step("Record the survivors", "The stack contains all survivors seen so far, in spatial order.", { arrays: { asteroids: nums, survivors: stack }, active: { asteroids: [i] } }, 3);
      });
      return stack;
    }
  },
  {
    id: 394, cases: [[{ text: "2[ab3[c]]" }, "abcccabccc"], [{ text: "x2[y]z" }, "xyyz"]],
    goal: "Decode repeated blocks, including blocks nested inside other repeated blocks.",
    idea: "At an opening bracket, save the outer prefix and repetition count; a closing bracket restores that frame.",
    trap: "Treating each digit as a complete count breaks multi-digit repetitions.", cost: "O(n + decoded length × nesting depth) time in this string-building implementation; output and frame space.",
    code: "read digits into a count\non [: push (prefix, count); start a new block\non ]: pop frame and append repeated block\non letter: append to current block",
    run({ text }, step) {
      const stack = [];
      let count = 0, current = "";
      [...text].forEach((character, i) => {
        if (/\d/.test(character)) count = count * 10 + Number(character);
        else if (character === "[") { stack.push([current, count]); current = ""; count = 0; }
        else if (character === "]") {
          const [prefix, repeats] = stack.pop();
          current = prefix + current.repeat(repeats);
        } else current += character;
        step("Read a nested instruction", `Read ${character}; the current decoded block is ${current || "empty"}.`, { arrays: { encoded: [...text], frames: stack.map(([prefix, n]) => `${prefix || "∅"} × ${n}`), decoded: [...current] }, active: { encoded: [i] }, vars: { count } }, character === "]" ? 2 : character === "[" ? 1 : 0);
      });
      return current;
    }
  },
  {
    id: 933, cases: [[{ calls: [10, 200, 3010, 3011] }, [1, 2, 3, 3]], [{ calls: [1, 5000] }, [1, 1]]],
    goal: "After each increasing timestamp, count calls in the inclusive interval [t − 3000, t].",
    idea: "Keep timestamps in order and move a queue head past calls strictly older than the window.",
    trap: "A call exactly 3000 milliseconds old still counts.", cost: "O(n) total time and O(n) stored timestamps in this head-index queue.",
    code: "append timestamp to queue\nwhile queue[head] < timestamp - 3000: head++\nanswer = queue.length - head",
    run({ calls }, step) {
      const queue = [], output = [];
      let head = 0;
      for (const t of calls) {
        queue.push(t);
        while (queue[head] < t - 3000) head++;
        output.push(queue.length - head);
        step("Keep the recent calls", `At ${t}, the interval starts at ${t - 3000}; ${queue.length - head} calls remain.`, { arrays: { queue: queue.slice(head), counts: output }, vars: { time: t, oldestAllowed: t - 3000 } }, 1);
      }
      return output;
    }
  },
  {
    id: 649, cases: [[{ text: "RDD" }, "Dire"], [{ text: "RR" }, "Radiant"]],
    goal: "Simulate senators who ban the next eligible opponent until only one party remains.",
    idea: "Two index queues preserve turn order. The earlier senator survives and reenters one round later.",
    trap: "A simple majority count ignores the order of bans.", cost: "O(n) amortized time and O(n) space with queue head indexes.",
    code: "queue the indexes of each party\ncompare the next indexes; the earlier one bans the later\nrequeue the winner at index + senate length",
    run({ text }, step) {
      const radiant = [], dire = [];
      [...text].forEach((party, i) => (party === "R" ? radiant : dire).push(i));
      let r = 0, d = 0;
      while (r < radiant.length && d < dire.length) {
        const ri = radiant[r++], di = dire[d++];
        const winner = ri < di ? "Radiant" : "Dire";
        if (ri < di) radiant.push(ri + text.length); else dire.push(di + text.length);
        step("Resolve the next turn", `${winner} acts first and bans the other queued senator.`, { arrays: { Radiant: radiant.slice(r), Dire: dire.slice(d) }, vars: { radiantTurn: ri, direTurn: di } }, 1);
      }
      return r < radiant.length ? "Radiant" : "Dire";
    }
  }
];
