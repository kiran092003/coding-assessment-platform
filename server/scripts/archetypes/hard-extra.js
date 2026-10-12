/* ───────────────────────────────────────────────────────────────────────────
   Additional hard archetypes.
   ─────────────────────────────────────────────────────────────────────────── */

const F = require('../lib/factories');
const { randInt, randArray, randWord, reader } = require('../lib/util');

const arr = F.arrayProblem('High');
const arrK = F.arrayKProblem('High');
const two = F.twoArrayProblem('High');
const str1 = F.strProblem('High');
const str2 = F.twoStrProblem('High');
const grid = F.gridProblem('High');

/* ── Binary search on the answer ───────────────────────────────────────── */

const binarySearch = [
    arrK('split-array-min-largest', 'Split Array to Minimise the Largest Part',
        'Split the array into exactly k contiguous non-empty parts so that the largest part sum is as small as possible. Print that smallest possible largest sum.',
        (a, k) => {
            const canSplit = (limit) => {
                let parts = 1;
                let cur = 0;
                for (const x of a) {
                    if (x > limit) return false;
                    if (cur + x > limit) { parts++; cur = x; }
                    else cur += x;
                }
                return parts <= k;
            };
            let lo = Math.max.apply(null, a);
            let hi = a.reduce((s, x) => s + x, 0);
            while (lo < hi) {
                const mid = Math.floor((lo + hi) / 2);
                if (canSplit(mid)) hi = mid; else lo = mid + 1;
            }
            return lo;
        }, { genK: (rng, n) => randInt(rng, 1, n), lo: 1, hi: 60, maxN: 300, returnType: 'long long' }),

    arrK('book-allocation', 'Book Allocation',
        'Element i is the page count of book i. Hand the books out to k students as contiguous blocks so that the largest number of pages given to any student is as small as possible. Print that number, or -1 if there are fewer books than students.',
        (a, k) => {
            if (k > a.length) return -1;
            const feasible = (limit) => {
                let students = 1;
                let cur = 0;
                for (const x of a) {
                    if (x > limit) return false;
                    if (cur + x > limit) { students++; cur = x; }
                    else cur += x;
                }
                return students <= k;
            };
            let lo = Math.max.apply(null, a);
            let hi = a.reduce((s, x) => s + x, 0);
            while (lo < hi) {
                const mid = Math.floor((lo + hi) / 2);
                if (feasible(mid)) hi = mid; else lo = mid + 1;
            }
            return lo;
        }, { genK: (rng, n) => randInt(rng, 1, n + 2), lo: 1, hi: 100, maxN: 300, returnType: 'long long' }),

    arrK('aggressive-cows', 'Maximise the Minimum Gap',
        'The array lists positions on a line. Choose k of them so that the smallest distance between any two chosen positions is as large as possible. Print that largest possible smallest distance.',
        (a, k) => {
            const pos = a.slice().sort((p, q) => p - q);
            if (k < 2) return 0;
            const fits = (gap) => {
                let count = 1;
                let last = pos[0];
                for (const p of pos) {
                    if (p - last >= gap) { count++; last = p; }
                }
                return count >= k;
            };
            let lo = 0;
            let hi = pos[pos.length - 1] - pos[0];
            while (lo < hi) {
                const mid = Math.ceil((lo + hi) / 2);
                if (fits(mid)) lo = mid; else hi = mid - 1;
            }
            return lo;
        }, { genK: (rng, n) => randInt(rng, 2, Math.max(2, Math.min(n, 8))), lo: 1, hi: 2000, maxN: 200 }),

    arrK('min-days-to-finish', 'Minimum Capacity',
        'Ship the elements in order, in at most k consecutive days, carrying any prefix each day. Print the smallest daily capacity that makes this possible.',
        (a, k) => {
            const ok = (cap) => {
                let days = 1;
                let cur = 0;
                for (const x of a) {
                    if (x > cap) return false;
                    if (cur + x > cap) { days++; cur = x; }
                    else cur += x;
                }
                return days <= k;
            };
            let lo = Math.max.apply(null, a);
            let hi = a.reduce((s, x) => s + x, 0);
            while (lo < hi) {
                const mid = Math.floor((lo + hi) / 2);
                if (ok(mid)) hi = mid; else lo = mid + 1;
            }
            return lo;
        }, { genK: (rng, n) => randInt(rng, 1, n), lo: 1, hi: 50, maxN: 300, returnType: 'long long' }),

    two('median-two-sorted', 'Median of Two Sorted Arrays',
        'Both arrays are sorted in non-decreasing order. Print the median of all 2n values combined, as the mean of the two middle values rounded down to an integer.',
        (a, b) => {
            const merged = a.concat(b).sort((p, q) => p - q);
            const n = merged.length;
            return Math.floor((merged[n / 2 - 1] + merged[n / 2]) / 2);
        }, { sorted: true, maxN: 400 }),
];

/* ── Dynamic programming ───────────────────────────────────────────────── */

const dp = [
    str1('longest-palindromic-subsequence', 'Longest Palindromic Subsequence',
        'Print the length of the longest subsequence of s that is a palindrome.',
        (s) => {
            const n = s.length;
            const dpTab = Array.from({ length: n }, () => new Array(n).fill(0));
            for (let i = 0; i < n; i++) dpTab[i][i] = 1;
            for (let len = 2; len <= n; len++) {
                for (let i = 0; i + len - 1 < n; i++) {
                    const j = i + len - 1;
                    dpTab[i][j] = s[i] === s[j]
                        ? (len === 2 ? 2 : dpTab[i + 1][j - 1] + 2)
                        : Math.max(dpTab[i + 1][j], dpTab[i][j - 1]);
                }
            }
            return n === 0 ? 0 : dpTab[0][n - 1];
        }, { maxN: 150 }),

    str1('min-insertions-palindrome', 'Insertions to Make a Palindrome',
        'Print the fewest characters that must be inserted anywhere in s to make it a palindrome.',
        (s) => {
            const n = s.length;
            const dpTab = Array.from({ length: n }, () => new Array(n).fill(0));
            for (let i = 0; i < n; i++) dpTab[i][i] = 1;
            for (let len = 2; len <= n; len++) {
                for (let i = 0; i + len - 1 < n; i++) {
                    const j = i + len - 1;
                    dpTab[i][j] = s[i] === s[j]
                        ? (len === 2 ? 2 : dpTab[i + 1][j - 1] + 2)
                        : Math.max(dpTab[i + 1][j], dpTab[i][j - 1]);
                }
            }
            return n === 0 ? 0 : n - dpTab[0][n - 1];
        }, { maxN: 150 }),

    arr('matrix-chain-multiplication', 'Matrix Chain Multiplication',
        'The array holds the dimensions of a chain of matrices: matrix i has size a[i] by a[i+1]. Print the fewest scalar multiplications needed to multiply the whole chain.',
        (a) => {
            const n = a.length;
            if (n < 3) return 0;
            const dpTab = Array.from({ length: n }, () => new Array(n).fill(0));
            for (let len = 2; len < n; len++) {
                for (let i = 0; i + len < n; i++) {
                    const j = i + len;
                    dpTab[i][j] = Infinity;
                    for (let k = i + 1; k < j; k++) {
                        const cost = dpTab[i][k] + dpTab[k][j] + a[i] * a[k] * a[j];
                        if (cost < dpTab[i][j]) dpTab[i][j] = cost;
                    }
                }
            }
            return dpTab[0][n - 1];
        }, { lo: 1, hi: 30, maxN: 60, returnType: 'long long' }),

    arr('burst-balloons', 'Burst Balloons',
        'Bursting element i earns the product of its value and the values of its current neighbours, treating a missing neighbour as 1. Print the maximum total earnings if you burst every element in the best order.',
        (a) => {
            const v = [1].concat(a, [1]);
            const n = v.length;
            const dpTab = Array.from({ length: n }, () => new Array(n).fill(0));
            for (let len = 2; len < n; len++) {
                for (let left = 0; left + len < n; left++) {
                    const right = left + len;
                    for (let k = left + 1; k < right; k++) {
                        const gain = dpTab[left][k] + dpTab[k][right] + v[left] * v[k] * v[right];
                        if (gain > dpTab[left][right]) dpTab[left][right] = gain;
                    }
                }
            }
            return dpTab[0][n - 1];
        }, { lo: 1, hi: 15, maxN: 60, returnType: 'long long' }),

    str2('word-break-count', 'Word Break Count',
        'Treat every non-empty prefix of t as a usable word. Print how many ways s can be written as a concatenation of those words, modulo 1000000007.',
        (s, t) => {
            const M = 1000000007n;
            const dict = new Set();
            for (let i = 1; i <= t.length; i++) dict.add(t.slice(0, i));
            const n = s.length;
            const ways = new Array(n + 1).fill(0n);
            ways[0] = 1n;
            for (let i = 1; i <= n; i++) {
                for (let j = 0; j < i; j++) {
                    if (ways[j] > 0n && dict.has(s.slice(j, i))) ways[i] = (ways[i] + ways[j]) % M;
                }
            }
            return ways[n].toString();
        }, { alphabet: 'ab', maxN: 60, maxM: 5, returnType: 'long long' }),

    arrK('partition-k-equal-sums', 'Partition into K Equal Sums',
        'Print 1 if the array can be split into exactly k groups with equal sums, 0 otherwise.',
        (a, k) => {
            const total = a.reduce((s, x) => s + x, 0);
            if (k <= 0 || total % k !== 0) return 0;
            const target = total / k;
            const sorted = a.slice().sort((p, q) => q - p);
            if (sorted[0] > target) return 0;
            const buckets = new Array(k).fill(0);
            const place = (i) => {
                if (i === sorted.length) return true;
                const tried = new Set();
                for (let b = 0; b < k; b++) {
                    if (tried.has(buckets[b])) continue;
                    if (buckets[b] + sorted[i] > target) continue;
                    tried.add(buckets[b]);
                    buckets[b] += sorted[i];
                    if (place(i + 1)) return true;
                    buckets[b] -= sorted[i];
                }
                return false;
            };
            return place(0) ? 1 : 0;
        }, { genK: (rng) => randInt(rng, 2, 4), lo: 1, hi: 12, maxN: 16 }),

    arr('max-sum-no-three-consecutive', 'No Three in a Row',
        'Choose elements to maximise the sum, but never take three consecutive elements. Print the largest achievable sum.',
        (a) => {
            const n = a.length;
            if (n === 0) return 0;
            if (n === 1) return Math.max(0, a[0]);
            const dpTab = new Array(n).fill(0);
            dpTab[0] = Math.max(0, a[0]);
            dpTab[1] = Math.max(dpTab[0], a[0] + a[1], a[1]);
            for (let i = 2; i < n; i++) {
                dpTab[i] = Math.max(
                    dpTab[i - 1],
                    dpTab[i - 2] + a[i],
                    (i >= 3 ? dpTab[i - 3] : 0) + a[i - 1] + a[i],
                );
            }
            return Math.max(0, dpTab[n - 1]);
        }, { lo: -20, hi: 50, maxN: 200, returnType: 'long long' }),
];

/* ── Data structures ───────────────────────────────────────────────────── */

const structures = [
    arr('count-smaller-after-self', 'Smaller Elements to the Right',
        'For every position print how many later elements are strictly smaller, as n values separated by single spaces.',
        (a) => {
            const res = new Array(a.length).fill(0);
            for (let i = 0; i < a.length; i++) {
                for (let j = i + 1; j < a.length; j++) if (a[j] < a[i]) res[i]++;
            }
            return res.join(' ');
        }, { maxN: 300, returnType: 'vector<int>' }),

    arr('min-of-every-window-size', 'Maximum of Window Minimums',
        'For every window size from 1 to n, take the minimum of each window of that size and then the maximum of those minimums. Print the n results, separated by single spaces.',
        (a, n) => {
            const out = [];
            for (let w = 1; w <= n; w++) {
                let best = -Infinity;
                for (let i = 0; i + w <= n; i++) {
                    let mn = Infinity;
                    for (let j = i; j < i + w; j++) if (a[j] < mn) mn = a[j];
                    if (mn > best) best = mn;
                }
                out.push(best);
            }
            return out.join(' ');
        }, { lo: 1, hi: 60, maxN: 120, returnType: 'vector<int>' }),

    arr('sliding-window-min', 'Sliding Window Minimum of Size Three',
        'Print the minimum of every window of three consecutive elements, left to right, separated by single spaces. If the array is shorter than three elements, print its minimum.',
        (a) => {
            if (a.length < 3) return String(Math.min.apply(null, a));
            const out = [];
            const dq = [];
            for (let i = 0; i < a.length; i++) {
                while (dq.length && dq[0] <= i - 3) dq.shift();
                while (dq.length && a[dq[dq.length - 1]] >= a[i]) dq.pop();
                dq.push(i);
                if (i >= 2) out.push(a[dq[0]]);
            }
            return out.join(' ');
        }, { maxN: 300, returnType: 'vector<int>' }),

    {
        slug: 'range-sum-with-updates',
        title: 'Range Sums with Updates',
        difficulty: 'High',
        returnType: 'long long',
        params: 'int n, int q, vector<int> arr, vector<vector<int>> queries',
        description: 'Process q operations on the array. An operation of the form `1 i v` sets position i (1-based) to v. An operation of the form `2 l r` asks for the sum of positions l to r inclusive. Print the sum of every answer to a type-2 operation.\n\n**Input**\nThe first line contains two integers `n` and `q`.\nThe second line contains `n` space-separated integers.\nEach of the next `q` lines contains an operation as described above.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 5) : randInt(rng, 10, 300);
            const q = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 10, 300);
            const a = randArray(rng, n, 1, 50);
            const ops = [];
            for (let i = 0; i < q; i++) {
                if (rng() < 0.4) ops.push('1 ' + randInt(rng, 1, n) + ' ' + randInt(rng, 1, 50));
                else {
                    const l = randInt(rng, 1, n);
                    ops.push('2 ' + l + ' ' + randInt(rng, l, n));
                }
            }
            return n + ' ' + q + '\n' + a.join(' ') + '\n' + ops.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const q = r.int();
            const a = r.ints(n);
            let answer = 0;
            for (let i = 0; i < q; i++) {
                const type = r.int();
                if (type === 1) {
                    const idx = r.int();
                    a[idx - 1] = r.int();
                } else {
                    const l = r.int();
                    const rr = r.int();
                    for (let j = l - 1; j < rr; j++) answer += a[j];
                }
            }
            return String(answer);
        },
    },
    {
        slug: 'lru-cache-simulation',
        title: 'Least Recently Used Cache',
        difficulty: 'High',
        returnType: 'int',
        params: 'int capacity, int q, vector<int> keys',
        description: 'Simulate a cache holding at most `capacity` keys. For each requested key in order: if it is already cached it counts as a hit and becomes the most recently used; otherwise it is inserted, evicting the least recently used key when the cache is full. Print the number of hits.\n\n**Input**\nThe first line contains two integers `capacity` and `q`.\nThe second line contains `q` space-separated keys.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const cap = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 2, 8);
            const q = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 20, 300);
            return cap + ' ' + q + '\n' + randArray(rng, q, 1, 12).join(' ') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const cap = r.int();
            const q = r.int();
            const keys = r.ints(q);
            const order = [];
            let hits = 0;
            for (const k of keys) {
                const at = order.indexOf(k);
                if (at !== -1) { hits++; order.splice(at, 1); order.push(k); }
                else {
                    if (order.length === cap) order.shift();
                    order.push(k);
                }
            }
            return String(hits);
        },
    },
];

/* ── Graphs and grids ──────────────────────────────────────────────────── */

const graphs = [
    {
        slug: 'bellman-ford-negative-cycle',
        title: 'Negative Cycle Detection',
        difficulty: 'High',
        returnType: 'int',
        params: 'int n, int m, vector<vector<int>> edges',
        description: 'A directed weighted graph has n vertices numbered 1..n and m edges. Print 1 if it contains a negative-weight cycle reachable from vertex 1, 0 otherwise.\n\n**Input**\nThe first line contains two integers `n` and `m`.\nEach of the next `m` lines contains three integers `u`, `v` and `w` — a directed edge from u to v of weight w.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 5, 30);
            const m = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, n, Math.min(80, n * 2));
            const lines = [];
            for (let i = 0; i < m; i++) {
                // Mostly positive weights, with some negatives so both verdicts occur.
                const w = rng() < 0.3 ? randInt(rng, -20, -1) : randInt(rng, 1, 20);
                lines.push(randInt(rng, 1, n) + ' ' + randInt(rng, 1, n) + ' ' + w);
            }
            return n + ' ' + m + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const m = r.int();
            const edges = [];
            for (let i = 0; i < m; i++) edges.push([r.int(), r.int(), r.int()]);
            const INF = Infinity;
            const dist = new Array(n + 1).fill(INF);
            dist[1] = 0;
            for (let iter = 0; iter < n - 1; iter++) {
                for (const [u, v, w] of edges) {
                    if (dist[u] !== INF && dist[u] + w < dist[v]) dist[v] = dist[u] + w;
                }
            }
            for (const [u, v, w] of edges) {
                if (dist[u] !== INF && dist[u] + w < dist[v]) return '1';
            }
            return '0';
        },
    },
    {
        slug: 'scc-count',
        title: 'Strongly Connected Components',
        difficulty: 'High',
        returnType: 'int',
        params: 'int n, int m, vector<vector<int>> edges',
        description: 'A directed graph has n vertices numbered 1..n and m edges. Print the number of strongly connected components.\n\n**Input**\nThe first line contains two integers `n` and `m`.\nEach of the next `m` lines contains two integers `u` and `v` — a directed edge from u to v.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 5, 40);
            const m = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, n, Math.min(100, n * 2));
            const lines = [];
            for (let i = 0; i < m; i++) lines.push(randInt(rng, 1, n) + ' ' + randInt(rng, 1, n));
            return n + ' ' + m + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const m = r.int();
            const adj = Array.from({ length: n + 1 }, () => []);
            const rev = Array.from({ length: n + 1 }, () => []);
            for (let i = 0; i < m; i++) {
                const u = r.int();
                const v = r.int();
                adj[u].push(v);
                rev[v].push(u);
            }
            // Kosaraju, with iterative traversals to avoid deep recursion.
            const visited = new Array(n + 1).fill(false);
            const order = [];
            for (let s = 1; s <= n; s++) {
                if (visited[s]) continue;
                const stack = [[s, 0]];
                visited[s] = true;
                while (stack.length) {
                    const frame = stack[stack.length - 1];
                    const u = frame[0];
                    if (frame[1] < adj[u].length) {
                        const v = adj[u][frame[1]++];
                        if (!visited[v]) { visited[v] = true; stack.push([v, 0]); }
                    } else {
                        order.push(u);
                        stack.pop();
                    }
                }
            }
            const seen = new Array(n + 1).fill(false);
            let components = 0;
            for (let i = order.length - 1; i >= 0; i--) {
                const s = order[i];
                if (seen[s]) continue;
                components++;
                const stack = [s];
                seen[s] = true;
                while (stack.length) {
                    const u = stack.pop();
                    for (const v of rev[u]) {
                        if (!seen[v]) { seen[v] = true; stack.push(v); }
                    }
                }
            }
            return String(components);
        },
    },
    grid('max-gold-path', 'Maximum Collected Value',
        'Starting at the top-left and moving only right or down to the bottom-right, print the largest total of the visited cells.',
        (g, n, m) => {
            const dpTab = Array.from({ length: n }, () => new Array(m).fill(-Infinity));
            dpTab[0][0] = g[0][0];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (i === 0 && j === 0) continue;
                    const up = i > 0 ? dpTab[i - 1][j] : -Infinity;
                    const left = j > 0 ? dpTab[i][j - 1] : -Infinity;
                    dpTab[i][j] = Math.max(up, left) + g[i][j];
                }
            }
            return dpTab[n - 1][m - 1];
        }, { lo: -15, hi: 40, maxDim: 12, returnType: 'long long' }),

    grid('surrounded-regions', 'Enclosed Regions',
        'The grid holds 0s (open) and 1s (wall). Print how many open cells belong to a region that does not touch the border of the grid.',
        (g, n, m) => {
            const seen = Array.from({ length: n }, () => new Array(m).fill(false));
            let enclosed = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (g[i][j] !== 0 || seen[i][j]) continue;
                    const cells = [];
                    let touchesBorder = false;
                    const stack = [[i, j]];
                    seen[i][j] = true;
                    while (stack.length) {
                        const [y, x] = stack.pop();
                        cells.push(1);
                        if (y === 0 || x === 0 || y === n - 1 || x === m - 1) touchesBorder = true;
                        for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < n && nx >= 0 && nx < m && !seen[ny][nx] && g[ny][nx] === 0) {
                                seen[ny][nx] = true;
                                stack.push([ny, nx]);
                            }
                        }
                    }
                    if (!touchesBorder) enclosed += cells.length;
                }
            }
            return enclosed;
        }, { lo: 0, hi: 1, maxDim: 12 }),

    str1('longest-substring-k-repeats', 'Longest Substring with Repeats',
        'Print the length of the longest substring of s in which every distinct character occurs at least twice. Print 0 if there is none.',
        (s) => {
            let best = 0;
            for (let i = 0; i < s.length; i++) {
                for (let j = i; j < s.length; j++) {
                    const sub = s.slice(i, j + 1);
                    const f = new Map();
                    for (const c of sub) f.set(c, (f.get(c) || 0) + 1);
                    let ok = true;
                    for (const v of f.values()) {
                        if (v < 2) { ok = false; break; }
                    }
                    if (ok && sub.length > best) best = sub.length;
                }
            }
            return best;
        }, { alphabet: 'abc', maxN: 80 }),
];

module.exports = [].concat(binarySearch, dp, structures, graphs);
