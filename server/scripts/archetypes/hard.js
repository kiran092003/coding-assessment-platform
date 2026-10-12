/* ───────────────────────────────────────────────────────────────────────────
   Hard (difficulty "High") archetypes.

   Sizes stay modest so the reference solution — and a contestant's solution —
   finish inside the sandbox's 5 s wall clock, while still being large enough
   that a naive approach times out on the bigger cases.
   ─────────────────────────────────────────────────────────────────────────── */

const { randInt, randArray, randWord, reader } = require('../lib/util');

const ONE_LINE = '\n\n**Output**\nPrint the answer on one line.';

const IO_N_ARRAY = [
    '**Input**',
    'The first line contains an integer `n`.',
    'The second line contains `n` space-separated integers.',
].join('\n');

const IO_N_K_ARRAY = [
    '**Input**',
    'The first line contains two integers `n` and `k`.',
    'The second line contains `n` space-separated integers.',
].join('\n');

const arrayProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'High',
    returnType: opts.returnType || 'int',
    params: 'int n, vector<int> arr',
    description: task + '\n\n' + IO_N_ARRAY + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 10, opts.maxN || 120);
        const lo = opts.lo === undefined ? 1 : opts.lo;
        const hi = opts.hi === undefined ? 100 : opts.hi;
        let arr = randArray(rng, n, lo, hi);
        if (opts.sorted) arr = arr.sort((a, b) => a - b);
        return n + '\n' + arr.join(' ') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        return String(solve(r.ints(n), n));
    },
});

const arrayKProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'High',
    returnType: opts.returnType || 'int',
    params: 'int n, int k, vector<int> arr',
    description: task + '\n\n' + IO_N_K_ARRAY + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 6) : randInt(rng, 10, opts.maxN || 100);
        const arr = randArray(rng, n, opts.lo === undefined ? 1 : opts.lo, opts.hi || 60);
        const k = opts.genK ? opts.genK(rng, n, arr) : randInt(rng, 1, n);
        return n + ' ' + k + '\n' + arr.join(' ') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        const k = r.int();
        return String(solve(r.ints(n), k, n));
    },
});

/* ── Arrays, stacks and windows ────────────────────────────────────────── */

const arrays = [
    arrayProblem(
        'trapping-rain-water', 'Trapping Rain Water',
        'Each element is the height of a bar of width 1. Print how many units of water are trapped between the bars after rain.',
        (h) => {
            let l = 0;
            let r = h.length - 1;
            let lm = 0;
            let rm = 0;
            let total = 0;
            while (l < r) {
                if (h[l] < h[r]) {
                    lm = Math.max(lm, h[l]);
                    total += lm - h[l];
                    l++;
                } else {
                    rm = Math.max(rm, h[r]);
                    total += rm - h[r];
                    r--;
                }
            }
            return total;
        },
        { lo: 0, hi: 40, returnType: 'long long' },
    ),
    arrayProblem(
        'largest-histogram-rectangle', 'Largest Rectangle in a Histogram',
        'Each element is the height of a bar of width 1. Print the area of the largest axis-aligned rectangle that fits inside the histogram.',
        (h) => {
            const st = [];
            let best = 0;
            for (let i = 0; i <= h.length; i++) {
                const cur = i === h.length ? 0 : h[i];
                while (st.length && h[st[st.length - 1]] >= cur) {
                    const top = st.pop();
                    const width = st.length ? i - st[st.length - 1] - 1 : i;
                    best = Math.max(best, h[top] * width);
                }
                st.push(i);
            }
            return best;
        },
        { lo: 0, hi: 60, returnType: 'long long' },
    ),
    arrayProblem(
        'next-greater-elements', 'Next Greater Element',
        'For every position print the first element to its right that is strictly greater, or -1 if there is none. Print n values separated by single spaces.',
        (a) => {
            const res = new Array(a.length).fill(-1);
            const st = [];
            for (let i = 0; i < a.length; i++) {
                while (st.length && a[st[st.length - 1]] < a[i]) res[st.pop()] = a[i];
                st.push(i);
            }
            return res.join(' ');
        },
        { returnType: 'vector<int>' },
    ),
    arrayProblem(
        'count-inversions-fast', 'Count Inversions (Large Input)',
        'Count the index pairs (i, j) with i < j and a[i] > a[j]. The input is large enough that a quadratic scan will not finish in time.',
        (a) => {
            let count = 0;
            const sortCount = (arr) => {
                if (arr.length < 2) return arr;
                const mid = arr.length >> 1;
                const left = sortCount(arr.slice(0, mid));
                const right = sortCount(arr.slice(mid));
                const merged = [];
                let i = 0;
                let j = 0;
                while (i < left.length && j < right.length) {
                    if (left[i] <= right[j]) merged.push(left[i++]);
                    else { count += left.length - i; merged.push(right[j++]); }
                }
                while (i < left.length) merged.push(left[i++]);
                while (j < right.length) merged.push(right[j++]);
                return merged;
            };
            sortCount(a);
            return count;
        },
        { maxN: 2000, hi: 100000, returnType: 'long long' },
    ),
    arrayProblem(
        'max-xor-pair', 'Maximum XOR of Two Elements',
        'Print the largest value of a[i] XOR a[j] over all pairs of positions.',
        (a) => {
            let best = 0;
            for (let i = 0; i < a.length; i++) {
                for (let j = i + 1; j < a.length; j++) best = Math.max(best, a[i] ^ a[j]);
            }
            return best;
        },
        { maxN: 400, hi: 100000 },
    ),
    arrayProblem(
        'longest-arithmetic-subseq', 'Longest Arithmetic Subsequence',
        'Print the length of the longest subsequence whose consecutive differences are all equal.',
        (a) => {
            const n = a.length;
            if (n <= 2) return n;
            let best = 2;
            const dp = Array.from({ length: n }, () => new Map());
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < i; j++) {
                    const d = a[i] - a[j];
                    const len = (dp[j].get(d) || 1) + 1;
                    if (len > (dp[i].get(d) || 0)) dp[i].set(d, len);
                    if (len > best) best = len;
                }
            }
            return best;
        },
        { maxN: 200, hi: 60 },
    ),
    arrayProblem(
        'partition-equal-subset', 'Equal Subset Partition',
        'Print 1 if the array can be split into two groups with equal sums, 0 otherwise.',
        (a) => {
            const total = a.reduce((s, x) => s + x, 0);
            if (total % 2) return 0;
            const half = total / 2;
            const can = new Uint8Array(half + 1);
            can[0] = 1;
            for (const x of a) {
                for (let v = half; v >= x; v--) if (can[v - x]) can[v] = 1;
            }
            return can[half] ? 1 : 0;
        },
        { maxN: 120, hi: 50 },
    ),
    arrayProblem(
        'min-jumps', 'Minimum Jumps to the End',
        'From position i you may jump to any position up to i + a[i]. Print the fewest jumps needed to reach the last position, or -1 if it is unreachable.',
        (a) => {
            const n = a.length;
            if (n === 1) return 0;
            let jumps = 0;
            let currentEnd = 0;
            let farthest = 0;
            for (let i = 0; i < n - 1; i++) {
                farthest = Math.max(farthest, i + a[i]);
                if (i === currentEnd) {
                    if (farthest <= i) return -1;
                    jumps++;
                    currentEnd = farthest;
                    if (currentEnd >= n - 1) return jumps;
                }
            }
            return currentEnd >= n - 1 ? jumps : -1;
        },
        { lo: 0, hi: 6, maxN: 200 },
    ),
    arrayKProblem(
        'sliding-window-max', 'Sliding Window Maximum',
        'Print the maximum of every window of k consecutive elements, left to right, separated by single spaces.',
        (a, k) => {
            const dq = [];
            const out = [];
            for (let i = 0; i < a.length; i++) {
                while (dq.length && dq[0] <= i - k) dq.shift();
                while (dq.length && a[dq[dq.length - 1]] <= a[i]) dq.pop();
                dq.push(i);
                if (i >= k - 1) out.push(a[dq[0]]);
            }
            return out.join(' ');
        },
        { returnType: 'vector<int>', genK: (rng, n) => randInt(rng, 1, n) },
    ),
    arrayKProblem(
        'subarrays-divisible-k', 'Subarrays Divisible by K',
        'Count the contiguous non-empty subarrays whose sum is divisible by k.',
        (a, k) => {
            const seen = new Map([[0, 1]]);
            let pref = 0;
            let total = 0;
            for (const x of a) {
                pref = ((pref + x) % k + k) % k;
                const c = seen.get(pref) || 0;
                total += c;
                seen.set(pref, c + 1);
            }
            return total;
        },
        { genK: (rng) => randInt(rng, 2, 20), lo: -30, hi: 30, maxN: 500, returnType: 'long long' },
    ),
    arrayKProblem(
        'knapsack-01', '0/1 Knapsack by Value',
        'Each element is both the weight and the value of an item. Choose items with total weight at most k to maximise total value, using each item at most once. Print the best total.',
        (a, k) => {
            const dp = new Array(k + 1).fill(0);
            for (const w of a) {
                for (let c = k; c >= w; c--) dp[c] = Math.max(dp[c], dp[c - w] + w);
            }
            return dp[k];
        },
        { genK: (rng) => randInt(rng, 10, 300), lo: 1, hi: 50, maxN: 100 },
    ),
    arrayKProblem(
        'coin-change-ways', 'Ways to Make Change',
        'The array lists coin denominations, each usable any number of times. Print the number of distinct multisets of coins summing to exactly k, modulo 1000000007.',
        (a, k) => {
            const M = 1000000007n;
            const dp = new Array(k + 1).fill(0n);
            dp[0] = 1n;
            for (const c of a) {
                for (let v = c; v <= k; v++) dp[v] = (dp[v] + dp[v - c]) % M;
            }
            return dp[k].toString();
        },
        { genK: (rng) => randInt(rng, 5, 200), lo: 1, hi: 20, maxN: 12, returnType: 'long long' },
    ),
    arrayKProblem(
        'max-profit-k-transactions', 'Best Trades with K Transactions',
        'Element i is the price on day i. Make at most k non-overlapping buy-then-sell trades to maximise profit. Print the maximum profit.',
        (prices, k) => {
            const n = prices.length;
            if (n < 2 || k === 0) return 0;
            const buy = new Array(k + 1).fill(-Infinity);
            const sell = new Array(k + 1).fill(0);
            for (const p of prices) {
                for (let t = 1; t <= k; t++) {
                    buy[t] = Math.max(buy[t], sell[t - 1] - p);
                    sell[t] = Math.max(sell[t], buy[t] + p);
                }
            }
            return sell[k];
        },
        { genK: (rng) => randInt(rng, 1, 5), lo: 1, hi: 100, maxN: 200 },
    ),
];

/* ── Strings ───────────────────────────────────────────────────────────── */

const STR_ONE = '**Input**\nA single line containing a string `s` of lowercase letters.';
const STR_TWO = '**Input**\nThe first line contains a string `s`.\nThe second line contains a string `t`.\nBoth consist of lowercase letters.';

const strProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'High',
    returnType: opts.returnType || 'int',
    params: 'string s',
    description: task + '\n\n' + STR_ONE + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 7) : randInt(rng, 10, opts.maxN || 60);
        return randWord(rng, n, opts.alphabet || 'abc') + '\n';
    },
    solve: (input) => String(solve(reader(input).word())),
});

const twoStrProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'High',
    returnType: opts.returnType || 'int',
    params: 'string s, string t',
    description: task + '\n\n' + STR_TWO + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 7) : randInt(rng, 10, opts.maxN || 40);
        const m = caseIdx < 3 ? randInt(rng, 2, 7) : randInt(rng, 3, opts.maxM || 12);
        const alpha = opts.alphabet || 'abc';
        return randWord(rng, n, alpha) + '\n' + randWord(rng, m, alpha) + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        return String(solve(r.word(), r.word()));
    },
});

const strings = [
    strProblem(
        'longest-valid-parentheses', 'Longest Balanced Bracket Run',
        'Read a as an opening bracket and b as a closing bracket. Print the length of the longest contiguous balanced substring.',
        (s) => {
            let best = 0;
            const st = [-1];
            for (let i = 0; i < s.length; i++) {
                if (s[i] === 'a') st.push(i);
                else {
                    st.pop();
                    if (st.length === 0) st.push(i);
                    else best = Math.max(best, i - st[st.length - 1]);
                }
            }
            return best;
        },
        { alphabet: 'ab', maxN: 200 },
    ),
    strProblem(
        'palindrome-min-cuts', 'Minimum Palindrome Partition',
        'Split s into the fewest possible palindromic pieces. Print the number of cuts, which is one less than the number of pieces.',
        (s) => {
            const n = s.length;
            const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
            for (let i = n - 1; i >= 0; i--) {
                for (let j = i; j < n; j++) {
                    isPal[i][j] = s[i] === s[j] && (j - i < 2 || isPal[i + 1][j - 1]);
                }
            }
            const dp = new Array(n + 1).fill(Infinity);
            dp[0] = 0;
            for (let j = 1; j <= n; j++) {
                for (let i = 0; i < j; i++) {
                    if (isPal[i][j - 1]) dp[j] = Math.min(dp[j], dp[i] + 1);
                }
            }
            return dp[n] - 1;
        },
        { maxN: 120 },
    ),
    strProblem(
        'count-distinct-subsequences', 'Count Distinct Subsequences',
        'Count the distinct non-empty subsequences of s, modulo 1000000007.',
        (s) => {
            const M = 1000000007n;
            const last = new Map();
            let total = 1n; // the empty subsequence
            for (const c of s) {
                const prev = total;
                total = (total * 2n) % M;
                if (last.has(c)) total = (total - last.get(c) + M) % M;
                last.set(c, prev);
            }
            return ((total - 1n + M) % M).toString();
        },
        { maxN: 200, returnType: 'long long' },
    ),
    strProblem(
        'longest-k-distinct', 'Longest Window with K Distinct Characters',
        'Print the length of the longest substring of s containing at most 2 distinct characters.',
        (s) => {
            const f = new Map();
            let l = 0;
            let best = 0;
            for (let r = 0; r < s.length; r++) {
                f.set(s[r], (f.get(s[r]) || 0) + 1);
                while (f.size > 2) {
                    const c = s[l];
                    f.set(c, f.get(c) - 1);
                    if (f.get(c) === 0) f.delete(c);
                    l++;
                }
                best = Math.max(best, r - l + 1);
            }
            return best;
        },
        { alphabet: 'abcde', maxN: 200 },
    ),
    twoStrProblem(
        'longest-common-substring', 'Longest Common Substring',
        'Print the length of the longest contiguous string that occurs in both s and t.',
        (s, t) => {
            let best = 0;
            const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
            for (let i = 1; i <= s.length; i++) {
                for (let j = 1; j <= t.length; j++) {
                    if (s[i - 1] === t[j - 1]) {
                        dp[i][j] = dp[i - 1][j - 1] + 1;
                        if (dp[i][j] > best) best = dp[i][j];
                    }
                }
            }
            return best;
        },
        { maxN: 120, maxM: 120 },
    ),
    twoStrProblem(
        'min-window-substring', 'Minimum Window Substring',
        'Print the length of the shortest substring of s that contains every character of t, counting repeats. Print -1 if no such substring exists.',
        (s, t) => {
            const need = new Map();
            for (const c of t) need.set(c, (need.get(c) || 0) + 1);
            let missing = t.length;
            let best = Infinity;
            let l = 0;
            for (let r = 0; r < s.length; r++) {
                const c = s[r];
                if (need.has(c)) {
                    if (need.get(c) > 0) missing--;
                    need.set(c, need.get(c) - 1);
                }
                while (missing === 0) {
                    best = Math.min(best, r - l + 1);
                    const d = s[l];
                    if (need.has(d)) {
                        need.set(d, need.get(d) + 1);
                        if (need.get(d) > 0) missing++;
                    }
                    l++;
                }
            }
            return best === Infinity ? -1 : best;
        },
        { maxN: 200, maxM: 6 },
    ),
    twoStrProblem(
        'count-subsequence-occurrences', 'Count Subsequence Occurrences',
        'Count how many distinct index sets of s spell out t as a subsequence, modulo 1000000007.',
        (s, t) => {
            const M = 1000000007n;
            const dp = new Array(t.length + 1).fill(0n);
            dp[0] = 1n;
            for (const c of s) {
                for (let j = t.length; j >= 1; j--) {
                    if (t[j - 1] === c) dp[j] = (dp[j] + dp[j - 1]) % M;
                }
            }
            return dp[t.length].toString();
        },
        { maxN: 120, maxM: 6, returnType: 'long long' },
    ),
    twoStrProblem(
        'wildcard-match', 'Wildcard Matching',
        'In t, the letter a matches any single character and the letter b matches any sequence of characters including the empty one. Every other letter matches only itself. Print 1 if t matches the whole of s, 0 otherwise.',
        (s, t) => {
            const n = s.length;
            const m = t.length;
            const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
            dp[0][0] = true;
            for (let j = 1; j <= m; j++) if (t[j - 1] === 'b') dp[0][j] = dp[0][j - 1];
            for (let i = 1; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    if (t[j - 1] === 'b') dp[i][j] = dp[i - 1][j] || dp[i][j - 1];
                    else if (t[j - 1] === 'a') dp[i][j] = dp[i - 1][j - 1];
                    else dp[i][j] = dp[i - 1][j - 1] && s[i - 1] === t[j - 1];
                }
            }
            return dp[n][m] ? 1 : 0;
        },
        { alphabet: 'abc', maxN: 40, maxM: 8 },
    ),
];

/* ── Graphs ────────────────────────────────────────────────────────────── */

const WEIGHTED_IO = [
    '**Input**',
    'The first line contains two integers `n` and `m` — vertices numbered 1..n, and edge count.',
    'Each of the next `m` lines contains three integers `u`, `v` and `w` — an undirected edge of weight `w`.',
].join('\n');

const weightedGraph = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'High',
    returnType: opts.returnType || 'int',
    params: 'int n, int m, vector<vector<int>> edges',
    description: task + '\n\n' + WEIGHTED_IO + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 6, 40);
        const m = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, n, Math.min(120, n * 3));
        const lines = [];
        for (let i = 0; i < m; i++) {
            lines.push(randInt(rng, 1, n) + ' ' + randInt(rng, 1, n) + ' ' + randInt(rng, 1, 50));
        }
        return n + ' ' + m + '\n' + lines.join('\n') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        const m = r.int();
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([r.int(), r.int(), r.int()]);
        return String(solve(n, edges));
    },
});

const graphs = [
    weightedGraph(
        'dijkstra-shortest-path', 'Shortest Weighted Path',
        'Print the total weight of a shortest path from vertex 1 to vertex n, or -1 if vertex n is unreachable.',
        (n, edges) => {
            const adj = Array.from({ length: n + 1 }, () => []);
            for (const [u, v, w] of edges) {
                adj[u].push([v, w]);
                adj[v].push([u, w]);
            }
            const dist = new Array(n + 1).fill(Infinity);
            dist[1] = 0;
            const visited = new Array(n + 1).fill(false);
            for (let iter = 0; iter < n; iter++) {
                let best = -1;
                for (let v = 1; v <= n; v++) {
                    if (!visited[v] && (best === -1 || dist[v] < dist[best])) best = v;
                }
                if (best === -1 || dist[best] === Infinity) break;
                visited[best] = true;
                for (const [to, w] of adj[best]) {
                    if (dist[best] + w < dist[to]) dist[to] = dist[best] + w;
                }
            }
            return dist[n] === Infinity ? -1 : dist[n];
        },
        { returnType: 'long long' },
    ),
    weightedGraph(
        'mst-weight', 'Minimum Spanning Tree',
        'Print the total weight of a minimum spanning tree. If the graph is not connected, print -1.',
        (n, edges) => {
            const sorted = edges.slice().sort((a, b) => a[2] - b[2]);
            const parent = Array.from({ length: n + 1 }, (_, i) => i);
            const find = (x) => {
                while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                return x;
            };
            let total = 0;
            let used = 0;
            for (const [u, v, w] of sorted) {
                const a = find(u);
                const b = find(v);
                if (a !== b) { parent[a] = b; total += w; used++; }
            }
            return used === n - 1 ? total : -1;
        },
        { returnType: 'long long' },
    ),
    weightedGraph(
        'graph-diameter-bounded', 'Longest Shortest Path',
        'Over every pair of vertices that can reach each other, print the largest shortest-path weight. Print 0 if no pair is connected.',
        (n, edges) => {
            const INF = Infinity;
            const d = Array.from({ length: n + 1 }, (_, i) =>
                Array.from({ length: n + 1 }, (_, j) => (i === j ? 0 : INF)));
            for (const [u, v, w] of edges) {
                if (w < d[u][v]) { d[u][v] = w; d[v][u] = w; }
            }
            for (let k = 1; k <= n; k++) {
                for (let i = 1; i <= n; i++) {
                    if (d[i][k] === INF) continue;
                    for (let j = 1; j <= n; j++) {
                        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
                    }
                }
            }
            let best = 0;
            for (let i = 1; i <= n; i++) {
                for (let j = i + 1; j <= n; j++) {
                    if (d[i][j] !== INF && d[i][j] > best) best = d[i][j];
                }
            }
            return best;
        },
        { returnType: 'long long' },
    ),
    {
        slug: 'topological-order-exists',
        title: 'Cycle Detection in a Directed Graph',
        difficulty: 'High',
        returnType: 'int',
        params: 'int n, int m, vector<vector<int>> edges',
        description: 'A directed graph has n vertices numbered 1..n and m edges. Print 1 if the graph has a topological ordering (that is, it contains no directed cycle), 0 otherwise.\n\n**Input**\nThe first line contains two integers `n` and `m`.\nEach of the next `m` lines contains two integers `u` and `v` — a directed edge from u to v.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 6, 40);
            const m = caseIdx < 3 ? randInt(rng, 1, 5) : randInt(rng, n, Math.min(100, n * 2));
            const lines = [];
            // Half the cases are forced acyclic by only pointing "forwards".
            const acyclic = caseIdx % 2 === 0;
            for (let i = 0; i < m; i++) {
                let u = randInt(rng, 1, n);
                let v = randInt(rng, 1, n);
                if (acyclic && u > v) { const t = u; u = v; v = t; }
                if (acyclic && u === v) v = Math.min(n, u + 1);
                lines.push(u + ' ' + v);
            }
            return n + ' ' + m + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const m = r.int();
            const adj = Array.from({ length: n + 1 }, () => []);
            const indeg = new Array(n + 1).fill(0);
            for (let i = 0; i < m; i++) {
                const u = r.int();
                const v = r.int();
                adj[u].push(v);
                indeg[v]++;
            }
            const q = [];
            for (let v = 1; v <= n; v++) if (indeg[v] === 0) q.push(v);
            let seen = 0;
            for (let h = 0; h < q.length; h++) {
                seen++;
                for (const to of adj[q[h]]) {
                    if (--indeg[to] === 0) q.push(to);
                }
            }
            return String(seen === n ? 1 : 0);
        },
    },
];

/* ── Grids ─────────────────────────────────────────────────────────────── */

const gridProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'High',
    returnType: opts.returnType || 'int',
    params: 'int n, int m, vector<vector<int>> grid',
    description: task + '\n\n**Input**\nThe first line contains two integers `n` and `m`.\nThe next `n` lines each contain `m` space-separated integers.' + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 4, 14);
        const m = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 4, 14);
        const rows = [];
        for (let i = 0; i < n; i++) {
            rows.push(randArray(rng, m, opts.lo === undefined ? 0 : opts.lo, opts.hi === undefined ? 1 : opts.hi).join(' '));
        }
        return n + ' ' + m + '\n' + rows.join('\n') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        const m = r.int();
        const g = [];
        for (let i = 0; i < n; i++) g.push(r.ints(m));
        return String(solve(g, n, m));
    },
});

const grids = [
    gridProblem(
        'count-islands', 'Count the Islands',
        'The grid holds 0s (water) and 1s (land). Print the number of connected groups of land, where cells connect horizontally and vertically.',
        (g, n, m) => {
            const seen = Array.from({ length: n }, () => new Array(m).fill(false));
            let count = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (g[i][j] !== 1 || seen[i][j]) continue;
                    count++;
                    const stack = [[i, j]];
                    seen[i][j] = true;
                    while (stack.length) {
                        const [y, x] = stack.pop();
                        for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < n && nx >= 0 && nx < m && !seen[ny][nx] && g[ny][nx] === 1) {
                                seen[ny][nx] = true;
                                stack.push([ny, nx]);
                            }
                        }
                    }
                }
            }
            return count;
        },
    ),
    gridProblem(
        'largest-ones-rectangle', 'Largest Rectangle of Ones',
        'The grid holds 0s and 1s. Print the area of the largest axis-aligned rectangle containing only 1s.',
        (g, n, m) => {
            const heights = new Array(m).fill(0);
            let best = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) heights[j] = g[i][j] === 1 ? heights[j] + 1 : 0;
                const st = [];
                for (let j = 0; j <= m; j++) {
                    const cur = j === m ? 0 : heights[j];
                    while (st.length && heights[st[st.length - 1]] >= cur) {
                        const top = st.pop();
                        const width = st.length ? j - st[st.length - 1] - 1 : j;
                        best = Math.max(best, heights[top] * width);
                    }
                    st.push(j);
                }
            }
            return best;
        },
    ),
    gridProblem(
        'grid-paths-obstacles', 'Paths Through a Grid',
        'The grid holds 0s (open) and 1s (blocked). Moving only right or down from the top-left to the bottom-right, print the number of distinct paths modulo 1000000007. Print 0 if either corner is blocked.',
        (g, n, m) => {
            const M = 1000000007n;
            if (g[0][0] === 1 || g[n - 1][m - 1] === 1) return '0';
            const dp = Array.from({ length: n }, () => new Array(m).fill(0n));
            dp[0][0] = 1n;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (g[i][j] === 1) { dp[i][j] = 0n; continue; }
                    if (i > 0) dp[i][j] = (dp[i][j] + dp[i - 1][j]) % M;
                    if (j > 0) dp[i][j] = (dp[i][j] + dp[i][j - 1]) % M;
                }
            }
            return dp[n - 1][m - 1].toString();
        },
        { returnType: 'long long' },
    ),
    gridProblem(
        'min-path-sum', 'Minimum Path Sum',
        'Moving only right or down from the top-left to the bottom-right, print the smallest possible sum of the visited cells.',
        (g, n, m) => {
            const dp = Array.from({ length: n }, () => new Array(m).fill(Infinity));
            dp[0][0] = g[0][0];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (i === 0 && j === 0) continue;
                    const up = i > 0 ? dp[i - 1][j] : Infinity;
                    const left = j > 0 ? dp[i][j - 1] : Infinity;
                    dp[i][j] = Math.min(up, left) + g[i][j];
                }
            }
            return dp[n - 1][m - 1];
        },
        { lo: 1, hi: 40, returnType: 'long long' },
    ),
    gridProblem(
        'max-sum-submatrix', 'Maximum Sum Submatrix',
        'Print the largest sum obtainable from a non-empty axis-aligned submatrix.',
        (g, n, m) => {
            let best = -Infinity;
            for (let top = 0; top < n; top++) {
                const col = new Array(m).fill(0);
                for (let bottom = top; bottom < n; bottom++) {
                    for (let j = 0; j < m; j++) col[j] += g[bottom][j];
                    let cur = col[0];
                    let localBest = col[0];
                    for (let j = 1; j < m; j++) {
                        cur = Math.max(col[j], cur + col[j]);
                        localBest = Math.max(localBest, cur);
                    }
                    best = Math.max(best, localBest);
                }
            }
            return best;
        },
        { lo: -20, hi: 20, returnType: 'long long' },
    ),
    gridProblem(
        'shortest-grid-path', 'Shortest Path Through a Grid',
        'The grid holds 0s (open) and 1s (blocked). Moving up, down, left or right between open cells, print the fewest moves from the top-left to the bottom-right, or -1 if there is no route.',
        (g, n, m) => {
            if (g[0][0] === 1 || g[n - 1][m - 1] === 1) return -1;
            const dist = Array.from({ length: n }, () => new Array(m).fill(-1));
            dist[0][0] = 0;
            const q = [[0, 0]];
            for (let h = 0; h < q.length; h++) {
                const [y, x] = q[h];
                for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < n && nx >= 0 && nx < m && dist[ny][nx] === -1 && g[ny][nx] === 0) {
                        dist[ny][nx] = dist[y][x] + 1;
                        q.push([ny, nx]);
                    }
                }
            }
            return dist[n - 1][m - 1];
        },
    ),
];

/* ── Simulation and combinatorics ──────────────────────────────────────── */

const misc = [
    {
        slug: 'josephus',
        title: 'Josephus Problem',
        difficulty: 'High',
        returnType: 'int',
        params: 'int n, int k',
        description: 'n people numbered 1..n stand in a circle. Counting from person 1, every k-th person is removed until one remains. Print the survivor.\n\n**Input**\nA single line with two integers `n` and `k`.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 10) : randInt(rng, 10, 5000);
            return n + ' ' + randInt(rng, 1, 20) + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const k = r.int();
            let survivor = 0;
            for (let i = 2; i <= n; i++) survivor = (survivor + k) % i;
            return String(survivor + 1);
        },
    },
    {
        slug: 'n-queens-count',
        title: 'N-Queens Count',
        difficulty: 'High',
        returnType: 'int',
        params: 'int n',
        description: 'Print the number of ways to place n queens on an n-by-n board so that no two attack each other.\n\n**Input**\nA single integer `n` with `1 <= n <= 11`.' + ONE_LINE,
        // The input space is only 11 wide, so the sample and hidden cases are
        // drawn from disjoint halves to guarantee 10 distinct inputs.
        genInput: (rng, caseIdx) => (caseIdx < 4 ? caseIdx + 1 : randInt(rng, 5, 11)) + '\n',
        solve: (input) => {
            const n = reader(input).int();
            let count = 0;
            const cols = new Array(n).fill(false);
            const d1 = new Array(2 * n).fill(false);
            const d2 = new Array(2 * n).fill(false);
            const place = (row) => {
                if (row === n) { count++; return; }
                for (let c = 0; c < n; c++) {
                    const a = row + c;
                    const b = row - c + n;
                    if (cols[c] || d1[a] || d2[b]) continue;
                    cols[c] = d1[a] = d2[b] = true;
                    place(row + 1);
                    cols[c] = d1[a] = d2[b] = false;
                }
            };
            place(0);
            return String(count);
        },
    },
    {
        slug: 'egg-drop',
        title: 'Egg Dropping',
        difficulty: 'High',
        returnType: 'int',
        params: 'int eggs, int floors',
        description: 'With a given number of identical eggs and floors, print the minimum number of trials that always determines the highest safe floor in the worst case.\n\n**Input**\nA single line with two integers `eggs` and `floors`.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const e = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 1, 8);
            const f = caseIdx < 3 ? randInt(rng, 1, 10) : randInt(rng, 10, 400);
            return e + ' ' + f + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const eggs = r.int();
            const floors = r.int();
            // dp[e] = floors coverable with e eggs in `trials` attempts.
            const dp = new Array(eggs + 1).fill(0);
            let trials = 0;
            while (dp[eggs] < floors) {
                trials++;
                for (let e = eggs; e >= 1; e--) dp[e] = dp[e] + dp[e - 1] + 1;
            }
            return String(trials);
        },
    },
    {
        slug: 'merge-intervals-length',
        title: 'Total Length of Merged Intervals',
        difficulty: 'High',
        returnType: 'long long',
        params: 'int n, vector<vector<int>> intervals',
        description: 'Print the total length covered by the union of n closed intervals.\n\n**Input**\nThe first line contains an integer `n`.\nEach of the next `n` lines contains two integers `l` and `r` with `l <= r`.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 5, 200);
            const lines = [];
            for (let i = 0; i < n; i++) {
                const l = randInt(rng, 0, 1000);
                lines.push(l + ' ' + (l + randInt(rng, 0, 100)));
            }
            return n + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const iv = [];
            for (let i = 0; i < n; i++) iv.push([r.int(), r.int()]);
            iv.sort((a, b) => a[0] - b[0]);
            let total = 0;
            let curL = null;
            let curR = null;
            for (const [l, rr] of iv) {
                if (curL === null) { curL = l; curR = rr; continue; }
                if (l <= curR) curR = Math.max(curR, rr);
                else { total += curR - curL; curL = l; curR = rr; }
            }
            if (curL !== null) total += curR - curL;
            return String(total);
        },
    },
    {
        slug: 'min-meeting-rooms',
        title: 'Minimum Meeting Rooms',
        difficulty: 'High',
        returnType: 'int',
        params: 'int n, vector<vector<int>> meetings',
        description: 'Given n meetings as half-open intervals, print the smallest number of rooms needed so that no two overlapping meetings share a room.\n\n**Input**\nThe first line contains an integer `n`.\nEach of the next `n` lines contains two integers `start` and `end` with `start < end`.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 5, 200);
            const lines = [];
            for (let i = 0; i < n; i++) {
                const s = randInt(rng, 0, 500);
                lines.push(s + ' ' + (s + randInt(rng, 1, 60)));
            }
            return n + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const events = [];
            for (let i = 0; i < n; i++) {
                const s = r.int();
                const e = r.int();
                events.push([s, 1], [e, -1]);
            }
            // End events sort before start events at the same instant, since a
            // room freed at time t can be reused at time t.
            events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            let cur = 0;
            let best = 0;
            for (const [, delta] of events) {
                cur += delta;
                if (cur > best) best = cur;
            }
            return String(best);
        },
    },
    {
        slug: 'decode-digit-string',
        title: 'Decode Ways',
        difficulty: 'High',
        returnType: 'long long',
        params: 'string digits',
        description: 'A digit string is decoded by mapping 1-26 to the letters a-z. Print the number of distinct decodings modulo 1000000007. A piece may not have a leading zero.\n\n**Input**\nA single line containing a string of digits.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 10, 200);
            return randWord(rng, n, caseIdx % 3 === 0 ? '0123' : '123456789') + '\n';
        },
        solve: (input) => {
            const s = reader(input).word();
            const M = 1000000007n;
            const n = s.length;
            const dp = new Array(n + 1).fill(0n);
            dp[0] = 1n;
            for (let i = 1; i <= n; i++) {
                if (s[i - 1] !== '0') dp[i] = (dp[i] + dp[i - 1]) % M;
                if (i >= 2) {
                    const two = Number(s.slice(i - 2, i));
                    if (s[i - 2] !== '0' && two >= 10 && two <= 26) dp[i] = (dp[i] + dp[i - 2]) % M;
                }
            }
            return dp[n].toString();
        },
    },
    arrayProblem(
        'rod-cutting', 'Rod Cutting',
        'Element i is the price of a rod piece of length i+1. Print the maximum total price obtainable by cutting a rod of length n into pieces, where pieces may repeat.',
        (prices, n) => {
            const dp = new Array(n + 1).fill(0);
            for (let len = 1; len <= n; len++) {
                for (let cut = 1; cut <= len; cut++) {
                    const candidate = prices[cut - 1] + dp[len - cut];
                    if (candidate > dp[len]) dp[len] = candidate;
                }
            }
            return dp[n];
        },
        { lo: 1, hi: 40, maxN: 120, returnType: 'long long' },
    ),
    arrayProblem(
        'longest-zigzag-subseq', 'Longest Zigzag Subsequence',
        'Print the length of the longest subsequence whose consecutive differences alternate between strictly positive and strictly negative.',
        (a) => {
            if (a.length === 0) return 0;
            let up = 1;
            let down = 1;
            for (let i = 1; i < a.length; i++) {
                if (a[i] > a[i - 1]) up = down + 1;
                else if (a[i] < a[i - 1]) down = up + 1;
            }
            return Math.max(up, down);
        },
        { maxN: 300, hi: 30 },
    ),
];

module.exports = [].concat(arrays, strings, graphs, grids, misc);
