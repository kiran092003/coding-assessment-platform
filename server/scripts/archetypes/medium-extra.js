/* ───────────────────────────────────────────────────────────────────────────
   Additional medium archetypes.
   ─────────────────────────────────────────────────────────────────────────── */

const F = require('../lib/factories');
const { randInt, randArray, randWord, reader, fixed } = require('../lib/util');

const arr = F.arrayProblem('Medium');
const arrK = F.arrayKProblem('Medium');
const two = F.twoArrayProblem('Medium');
const int1 = F.intProblem('Medium');
const grid = F.gridProblem('Medium');

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/* A list of n lowercase words, one per line. */
const wordsProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'int n, vector<string> words',
    description: task + '\n\n**Input**\nThe first line contains an integer `n`.\nEach of the next `n` lines contains one lowercase word.' + F.OUT_ONE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 5, opts.maxN || 25);
        const lines = [];
        for (let i = 0; i < n; i++) {
            lines.push(randWord(rng, randInt(rng, 1, opts.wordLen || 6), opts.alphabet || 'abc'));
        }
        return n + '\n' + lines.join('\n') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        return String(solve(r.words(n), n));
    },
});

/* An interval list. */
const intervalProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'int n, vector<vector<int>> intervals',
    description: task + '\n\n**Input**\nThe first line contains an integer `n`.\nEach of the next `n` lines contains two integers `l` and `r` with `l <= r`.' + F.OUT_ONE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 5, opts.maxN || 60);
        const lines = [];
        for (let i = 0; i < n; i++) {
            const l = randInt(rng, 0, 200);
            lines.push(l + ' ' + (l + randInt(rng, 1, 40)));
        }
        return n + '\n' + lines.join('\n') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        const iv = [];
        for (let i = 0; i < n; i++) iv.push([r.int(), r.int()]);
        return String(solve(iv, n));
    },
});

/* Undirected graph, unweighted. */
const graphProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'int n, int m, vector<vector<int>> edges',
    description: task + '\n\n**Input**\nThe first line contains two integers `n` and `m` — vertices numbered 1..n, and edge count.\nEach of the next `m` lines contains two integers `u` and `v`.' + F.OUT_ONE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 5, opts.maxN || 30);
        const m = caseIdx < 3 ? randInt(rng, 1, 5) : randInt(rng, 3, Math.min(80, n * 2));
        const lines = [];
        for (let i = 0; i < m; i++) {
            let u = randInt(rng, 1, n);
            let v = randInt(rng, 1, n);
            if (opts.bipartiteBias && caseIdx % 2 === 0) {
                // Bias half the cases toward a genuine bipartition.
                const half = Math.max(1, Math.floor(n / 2));
                u = randInt(rng, 1, half);
                v = randInt(rng, half + 1, n);
            }
            lines.push(u + ' ' + v);
        }
        return n + ' ' + m + '\n' + lines.join('\n') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        const m = r.int();
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([r.int(), r.int()]);
        return String(solve(n, edges, m));
    },
});

/* ── Greedy ────────────────────────────────────────────────────────────── */

const greedy = [
    intervalProblem('activity-selection', 'Maximum Non-Overlapping Intervals',
        'Choose as many intervals as possible so that no two chosen intervals overlap. Intervals that merely touch at an endpoint are considered overlapping. Print how many you can choose.',
        (iv) => {
            const sorted = iv.slice().sort((a, b) => a[1] - b[1]);
            let count = 0;
            let lastEnd = -Infinity;
            for (const [l, r] of sorted) {
                if (l > lastEnd) { count++; lastEnd = r; }
            }
            return count;
        }),

    intervalProblem('min-platforms', 'Minimum Platforms',
        'Each interval is a train occupying a platform from l to r inclusive. Print the fewest platforms needed so no two trains overlap on one platform.',
        (iv) => {
            const starts = iv.map((x) => x[0]).sort((a, b) => a - b);
            const ends = iv.map((x) => x[1]).sort((a, b) => a - b);
            let i = 0;
            let j = 0;
            let cur = 0;
            let best = 0;
            while (i < starts.length) {
                if (starts[i] <= ends[j]) { cur++; i++; if (cur > best) best = cur; }
                else { cur--; j++; }
            }
            return best;
        }),

    intervalProblem('count-merged-intervals', 'Count Merged Intervals',
        'Merge every pair of overlapping or touching intervals and print how many intervals remain.',
        (iv) => {
            const sorted = iv.slice().sort((a, b) => a[0] - b[0]);
            let count = 0;
            let curEnd = -Infinity;
            for (const [l, r] of sorted) {
                if (l > curEnd) { count++; curEnd = r; }
                else if (r > curEnd) curEnd = r;
            }
            return count;
        }),

    arr('gas-station-start', 'Circular Route Start',
        'Element i is the net fuel gained at stop i on a circular route. Print the smallest 0-based starting stop from which the running total never goes negative, or -1 if no such stop exists.',
        (a) => {
            const total = a.reduce((s, x) => s + x, 0);
            if (total < 0) return -1;
            let start = 0;
            let tank = 0;
            for (let i = 0; i < a.length; i++) {
                tank += a[i];
                if (tank < 0) { start = i + 1; tank = 0; }
            }
            return start >= a.length ? -1 : start;
        }, { lo: -20, hi: 20 }),

    arr('can-reach-end', 'Reachable End',
        'From position i you may jump to any position up to i + a[i]. Print 1 if the last position is reachable from position 0, 0 otherwise.',
        (a) => {
            let far = 0;
            for (let i = 0; i < a.length; i++) {
                if (i > far) return 0;
                far = Math.max(far, i + a[i]);
            }
            return 1;
        }, { lo: 0, hi: 4 }),

    arr('min-candies', 'Fair Distribution',
        'Every child gets at least one sweet, and a child with a strictly higher rating than an immediate neighbour gets strictly more sweets than that neighbour. Print the smallest total number of sweets.',
        (a) => {
            const n = a.length;
            const give = new Array(n).fill(1);
            for (let i = 1; i < n; i++) if (a[i] > a[i - 1]) give[i] = give[i - 1] + 1;
            for (let i = n - 2; i >= 0; i--) {
                if (a[i] > a[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1;
            }
            return give.reduce((s, x) => s + x, 0);
        }, { lo: 1, hi: 6, returnType: 'long long' }),

    arr('fractional-knapsack-density', 'Highest Value Density',
        'Element i is the value of item i, and the item weight is its 1-based index. Print the largest value-to-weight ratio, with exactly four digits after the decimal point.',
        (a) => {
            let best = 0;
            a.forEach((v, i) => {
                const d = v / (i + 1);
                if (d > best) best = d;
            });
            return fixed(best, 4);
        }, { lo: 1, returnType: 'double' }),
];

/* ── Sorting-flavoured ─────────────────────────────────────────────────── */

const sorting = [
    arr('sort-by-frequency', 'Sort by Frequency',
        'Print the elements ordered by how often they occur, most frequent first. Ties are broken by the smaller value first.',
        (a) => {
            const f = new Map();
            for (const x of a) f.set(x, (f.get(x) || 0) + 1);
            return a.slice().sort((p, q) => f.get(q) - f.get(p) || p - q).join(' ');
        }, { hi: 8, returnType: 'vector<int>' }),

    arrK('k-closest-to-value', 'K Closest Values',
        'Print the k elements closest to the value of the first element, in non-decreasing order, separated by single spaces. Distance ties prefer the smaller value.',
        (a, k) => {
            const target = a[0];
            return a.slice()
                .sort((p, q) => Math.abs(p - target) - Math.abs(q - target) || p - q)
                .slice(0, k)
                .sort((p, q) => p - q)
                .join(' ');
        }, { returnType: 'vector<int>' }),

    arr('count-pairs-sorted-diff', 'Smallest Adjacent Gap',
        'Print the smallest absolute difference between any two elements.',
        (a) => {
            const s = a.slice().sort((p, q) => p - q);
            let best = Infinity;
            for (let i = 1; i < s.length; i++) best = Math.min(best, s[i] - s[i - 1]);
            return s.length < 2 ? 0 : best;
        }, { minN: 2 }),

    two('max-dot-after-sort', 'Maximised Dot Product',
        'Reorder both arrays freely to maximise the sum of a[i] * b[i]. Print that maximum.',
        (a, b) => {
            const x = a.slice().sort((p, q) => p - q);
            const y = b.slice().sort((p, q) => p - q);
            return x.reduce((s, v, i) => s + v * y[i], 0);
        }, { returnType: 'long long' }),

    two('min-dot-after-sort', 'Minimised Dot Product',
        'Reorder both arrays freely to minimise the sum of a[i] * b[i]. Print that minimum.',
        (a, b) => {
            const x = a.slice().sort((p, q) => p - q);
            const y = b.slice().sort((p, q) => q - p);
            return x.reduce((s, v, i) => s + v * y[i], 0);
        }, { returnType: 'long long' }),

    two('intersection-sorted', 'Sorted Intersection',
        'Print the distinct values present in both arrays, in non-decreasing order, separated by single spaces. Print -1 if the arrays share no value.',
        (a, b) => {
            const sb = new Set(b);
            const common = Array.from(new Set(a)).filter((x) => sb.has(x)).sort((p, q) => p - q);
            // An empty line would be ambiguous to compare against stdout.
            return common.length ? common.join(' ') : '-1';
        }, { hi: 15, returnType: 'vector<int>' }),
];

/* ── Stacks and expressions ────────────────────────────────────────────── */

const stacks = [
    {
        slug: 'evaluate-rpn',
        title: 'Evaluate Reverse Polish Notation',
        difficulty: 'Medium',
        returnType: 'int',
        params: 'int n, vector<string> tokens',
        description: 'Evaluate an expression in reverse Polish notation. Tokens are integers and the operators +, - and *. Division does not occur. Print the resulting value.\n\n**Input**\nThe first line contains an integer `n` — the number of tokens.\nThe second line contains `n` space-separated tokens.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            // Build a guaranteed-valid expression: start with two operands, then
            // alternate between pushing an operand and applying an operator.
            const ops = ['+', '-', '*'];
            const tokens = [String(randInt(rng, 1, 9)), String(randInt(rng, 1, 9))];
            const rounds = caseIdx < 3 ? randInt(rng, 1, 2) : randInt(rng, 3, 10);
            for (let i = 0; i < rounds; i++) {
                tokens.push(ops[Math.floor(rng() * 3)]);
                tokens.push(String(randInt(rng, 1, 9)));
            }
            tokens.push(ops[Math.floor(rng() * 3)]);
            return tokens.length + '\n' + tokens.join(' ') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const tokens = r.words(n);
            const st = [];
            for (const t of tokens) {
                if (t === '+' || t === '-' || t === '*') {
                    const b = st.pop();
                    const a = st.pop();
                    st.push(t === '+' ? a + b : t === '-' ? a - b : a * b);
                } else st.push(parseInt(t, 10));
            }
            return String(st[st.length - 1]);
        },
    },
    {
        slug: 'valid-bracket-sequence',
        title: 'Valid Bracket Sequence',
        difficulty: 'Medium',
        returnType: 'int',
        params: 'string s',
        description: 'The string contains the characters ( ) [ ] { }. Print 1 if every bracket is correctly matched and nested, 0 otherwise.\n\n**Input**\nA single line containing the bracket string.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const pairs = [['(', ')'], ['[', ']'], ['{', '}']];
            if (caseIdx % 2 === 0) {
                // Build a correctly nested sequence.
                let s = '';
                const depth = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 3, 12);
                const stack = [];
                for (let i = 0; i < depth; i++) {
                    const p = pairs[Math.floor(rng() * 3)];
                    s += p[0];
                    stack.push(p[1]);
                }
                while (stack.length) s += stack.pop();
                return s + '\n';
            }
            const chars = '()[]{}';
            const n = caseIdx < 3 ? randInt(rng, 2, 6) : randInt(rng, 6, 24);
            let s = '';
            for (let i = 0; i < n; i++) s += chars[Math.floor(rng() * chars.length)];
            return s + '\n';
        },
        solve: (input) => {
            const s = String(input).trim();
            const close = { ')': '(', ']': '[', '}': '{' };
            const st = [];
            for (const c of s) {
                if (c === '(' || c === '[' || c === '{') st.push(c);
                else if (close[c]) {
                    if (st.pop() !== close[c]) return '0';
                }
            }
            return st.length === 0 ? '1' : '0';
        },
    },
];

/* ── Words ─────────────────────────────────────────────────────────────── */

const words = [
    wordsProblem('group-anagrams-count', 'Count Anagram Groups',
        'Group the words so that two words are in the same group exactly when they are anagrams of each other. Print the number of groups.',
        (ws) => new Set(ws.map((w) => w.split('').sort().join(''))).size),

    wordsProblem('longest-common-prefix-many', 'Common Prefix of Many Words',
        'Print the length of the longest string that is a prefix of every word.',
        (ws) => {
            let p = ws[0];
            for (const w of ws) {
                let i = 0;
                while (i < p.length && i < w.length && p[i] === w[i]) i++;
                p = p.slice(0, i);
            }
            return p.length;
        }, { alphabet: 'ab' }),

    wordsProblem('most-frequent-word', 'Most Frequent Word',
        'Print the word that occurs most often. If several tie, print the alphabetically smallest.',
        (ws) => {
            const f = new Map();
            for (const w of ws) f.set(w, (f.get(w) || 0) + 1);
            return Array.from(f.keys()).sort((a, b) => f.get(b) - f.get(a) || (a < b ? -1 : 1))[0];
        }, { returnType: 'string', wordLen: 3 }),

    wordsProblem('longest-word-length', 'Longest Word',
        'Print the length of the longest word.',
        (ws) => Math.max.apply(null, ws.map((w) => w.length))),

    wordsProblem('count-distinct-words', 'Count Distinct Words',
        'Print how many distinct words appear in the list.',
        (ws) => new Set(ws).size, { wordLen: 3 }),

    wordsProblem('sort-words-by-length', 'Sort Words by Length',
        'Print the words ordered by increasing length, breaking ties alphabetically, separated by single spaces.',
        (ws) => ws.slice().sort((a, b) => a.length - b.length || (a < b ? -1 : 1)).join(' '),
        { returnType: 'vector<string>' }),
];

/* ── Number theory ─────────────────────────────────────────────────────── */

const numbers = [
    int1('is-happy-number', 'Happy Number',
        'Repeatedly replace n with the sum of the squares of its digits. Print 1 if this reaches 1, 0 if it falls into a cycle.',
        (n) => {
            const seen = new Set();
            let x = n;
            while (x !== 1 && !seen.has(x)) {
                seen.add(x);
                x = String(x).split('').reduce((s, d) => s + Number(d) * Number(d), 0);
            }
            return x === 1 ? 1 : 0;
        }, { range: [1, 100000] }),

    int1('count-perfect-squares', 'Perfect Squares up to N',
        'Print how many perfect squares are in the range [1, n].',
        (n) => Math.floor(Math.sqrt(n)), { range: [1, 1000000000] }),

    int1('sum-primes-upto', 'Sum of Primes up to N',
        'Print the sum of every prime number less than or equal to n.',
        (n) => {
            if (n < 2) return 0;
            const sieve = new Uint8Array(n + 1);
            let total = 0;
            for (let i = 2; i <= n; i++) {
                if (!sieve[i]) {
                    total += i;
                    for (let j = i * i; j <= n; j += i) sieve[j] = 1;
                }
            }
            return total;
        }, { range: [1, 100000], returnType: 'long long' }),

    int1('count-armstrong-upto', 'Armstrong Numbers up to N',
        'Print how many Armstrong numbers are in the range [1, n]. An Armstrong number equals the sum of its digits each raised to the power of the digit count.',
        (n) => {
            let c = 0;
            for (let v = 1; v <= n; v++) {
                const d = String(v).split('');
                if (d.reduce((s, x) => s + Math.pow(Number(x), d.length), 0) === v) c++;
            }
            return c;
        }, { range: [1, 100000] }),

    int1('count-divisor-pairs', 'Divisor Pairs',
        'Print how many ordered pairs (a, b) of positive integers satisfy a * b == n.',
        (n) => {
            let c = 0;
            for (let i = 1; i * i <= n; i++) {
                if (n % i === 0) c += (i === n / i ? 1 : 2);
            }
            return c;
        }, { range: [1, 1000000] }),

    arr('gcd-of-array', 'GCD of an Array',
        'Print the greatest common divisor of every element.',
        (a) => a.reduce((x, y) => gcd(x, y)), { lo: 1, hi: 200 }),

    arr('lcm-of-array', 'LCM of an Array',
        'Print the least common multiple of every element, modulo 1000000007.',
        (a) => {
            const M = 1000000007n;
            let cur = 1n;
            let real = 1;
            for (const x of a) {
                real = (real / gcd(real, x)) * x;
                cur = BigInt(real) % M;
            }
            return cur.toString();
        }, { lo: 1, hi: 12, maxN: 8, returnType: 'long long' }),
];

/* ── Dynamic programming ───────────────────────────────────────────────── */

const dp = [
    int1('tribonacci', 'Tribonacci Numbers',
        'With T(0) = 0, T(1) = 1 and T(2) = 1, each later term is the sum of the previous three. Print T(n) modulo 1000000007.',
        (n) => {
            const M = 1000000007n;
            const t = [0n, 1n, 1n];
            if (n < 3) return t[n].toString();
            let a = 0n;
            let b = 1n;
            let c = 1n;
            for (let i = 3; i <= n; i++) {
                const d = (a + b + c) % M;
                a = b; b = c; c = d;
            }
            return c.toString();
        }, { range: [0, 10000], returnType: 'long long' }),

    int1('binary-strings-no-consecutive-ones', 'Binary Strings Without Adjacent Ones',
        'Print how many binary strings of length n contain no two adjacent 1s, modulo 1000000007.',
        (n) => {
            const M = 1000000007n;
            let endZero = 1n;
            let endOne = 1n;
            for (let i = 2; i <= n; i++) {
                const nz = (endZero + endOne) % M;
                const no = endZero;
                endZero = nz;
                endOne = no;
            }
            return ((endZero + endOne) % M).toString();
        }, { range: [1, 10000], returnType: 'long long' }),

    int1('tile-2xn', 'Tiling a 2-by-N Strip',
        'Print how many ways a 2-by-n strip can be tiled with 2-by-1 dominoes, modulo 1000000007.',
        (n) => {
            const M = 1000000007n;
            let a = 1n;
            let b = 1n;
            for (let i = 2; i <= n; i++) {
                const c = (a + b) % M;
                a = b;
                b = c;
            }
            return b.toString();
        }, { range: [1, 10000], returnType: 'long long' }),

    grid('unique-paths-open-grid', 'Paths in an Open Grid',
        'Ignore the values in the grid and use only its shape. Moving only right or down from the top-left to the bottom-right, print the number of distinct paths modulo 1000000007.',
        (g, n, m) => {
            const M = 1000000007n;
            const dpRow = new Array(m).fill(1n);
            for (let i = 1; i < n; i++) {
                for (let j = 1; j < m; j++) dpRow[j] = (dpRow[j] + dpRow[j - 1]) % M;
            }
            return dpRow[m - 1].toString();
        }, { returnType: 'long long' }),

    arr('min-cost-climbing', 'Minimum Cost to Climb',
        'Element i is the cost of stepping on stair i. From a stair you may climb one or two stairs. You may start on stair 0 or stair 1. Print the least total cost to climb past the last stair.',
        (a) => {
            let one = 0;
            let twoBack = 0;
            for (let i = 0; i < a.length; i++) {
                const cur = a[i] + Math.min(one, twoBack);
                twoBack = one;
                one = cur;
            }
            return Math.min(one, twoBack);
        }, { lo: 0, hi: 60, minN: 2, returnType: 'long long' }),

    arr('max-sum-increasing-subseq', 'Maximum Increasing Subsequence Sum',
        'Print the largest sum of a strictly increasing subsequence of the array.',
        (a) => {
            const dpArr = a.slice();
            for (let i = 0; i < a.length; i++) {
                for (let j = 0; j < i; j++) {
                    if (a[j] < a[i] && dpArr[j] + a[i] > dpArr[i]) dpArr[i] = dpArr[j] + a[i];
                }
            }
            return Math.max.apply(null, dpArr);
        }, { lo: 1, hi: 60, maxN: 80, returnType: 'long long' }),

    arr('count-ways-sum-steps', 'Step Combinations',
        'Element i is an allowed step size. Print how many ordered ways there are to climb exactly n stairs using those step sizes, modulo 1000000007, where n is the number of elements.',
        (a, n) => {
            const M = 1000000007n;
            const ways = new Array(n + 1).fill(0n);
            ways[0] = 1n;
            for (let v = 1; v <= n; v++) {
                for (const s of a) {
                    if (s <= v) ways[v] = (ways[v] + ways[v - s]) % M;
                }
            }
            return ways[n].toString();
        }, { lo: 1, hi: 5, maxN: 30, returnType: 'long long' }),
];

/* ── Graphs ────────────────────────────────────────────────────────────── */

const graphs = [
    graphProblem('is-bipartite', 'Bipartite Check',
        'Print 1 if the vertices can be split into two groups so that every edge joins the two groups, 0 otherwise.',
        (n, edges) => {
            const adj = Array.from({ length: n + 1 }, () => []);
            for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
            const colour = new Array(n + 1).fill(-1);
            for (let s = 1; s <= n; s++) {
                if (colour[s] !== -1) continue;
                colour[s] = 0;
                const q = [s];
                for (let h = 0; h < q.length; h++) {
                    const u = q[h];
                    for (const v of adj[u]) {
                        if (v === u) return 0;
                        if (colour[v] === -1) { colour[v] = 1 - colour[u]; q.push(v); }
                        else if (colour[v] === colour[u]) return 0;
                    }
                }
            }
            return 1;
        }, { bipartiteBias: true }),

    graphProblem('max-degree', 'Highest Degree',
        'Print the largest number of edge endpoints at any single vertex. A self-loop contributes two.',
        (n, edges) => {
            const deg = new Array(n + 1).fill(0);
            for (const [u, v] of edges) { deg[u]++; deg[v]++; }
            return Math.max.apply(null, deg.slice(1));
        }),

    graphProblem('count-triangles', 'Count Triangles',
        'Print the number of unordered vertex triples that are pairwise connected by an edge.',
        (n, edges) => {
            const set = new Set();
            for (const [u, v] of edges) {
                if (u !== v) set.add(Math.min(u, v) + ',' + Math.max(u, v));
            }
            const has = (a, b) => set.has(Math.min(a, b) + ',' + Math.max(a, b));
            let count = 0;
            for (let a = 1; a <= n; a++) {
                for (let b = a + 1; b <= n; b++) {
                    if (!has(a, b)) continue;
                    for (let c = b + 1; c <= n; c++) if (has(a, c) && has(b, c)) count++;
                }
            }
            return count;
        }, { maxN: 25 }),

    graphProblem('largest-component-size', 'Largest Component',
        'Print the number of vertices in the largest connected component.',
        (n, edges) => {
            const parent = Array.from({ length: n + 1 }, (_, i) => i);
            const find = (x) => {
                while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                return x;
            };
            for (const [u, v] of edges) {
                const a = find(u);
                const b = find(v);
                if (a !== b) parent[a] = b;
            }
            const size = new Map();
            for (let v = 1; v <= n; v++) {
                const root = find(v);
                size.set(root, (size.get(root) || 0) + 1);
            }
            return Math.max.apply(null, Array.from(size.values()));
        }),
];

module.exports = [].concat(greedy, sorting, stacks, words, numbers, dp, graphs);
