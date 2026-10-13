/* ───────────────────────────────────────────────────────────────────────────
   Shared problem builders.

   Each factory fixes an input format and its documented I/O contract, so an
   archetype only has to supply a statement and a reference solution.
   ─────────────────────────────────────────────────────────────────────────── */

const { randInt, randArray, randWord, reader, LOWER } = require('./util');

const OUT_ONE = '\n\n**Output**\nPrint the answer on one line.';

/* Constraints are derived from the same opts the generator uses, so the stated
   bounds cannot drift away from the data that actually gets produced. */
const rangeLine = (name, lo, hi) => '- `' + lo + ' <= ' + name + ' <= ' + hi + '`';
const sizeLine  = (name, maxN, minN) => rangeLine(name, minN === undefined ? 1 : minN, maxN);

const IO = {
    nArray: [
        '**Input**',
        'The first line contains an integer `n`.',
        'The second line contains `n` space-separated integers.',
    ].join('\n'),
    nkArray: [
        '**Input**',
        'The first line contains two integers `n` and `k`.',
        'The second line contains `n` space-separated integers.',
    ].join('\n'),
    twoArrays: [
        '**Input**',
        'The first line contains an integer `n`.',
        'The second line contains `n` space-separated integers — the array `a`.',
        'The third line contains `n` space-separated integers — the array `b`.',
    ].join('\n'),
    grid: [
        '**Input**',
        'The first line contains two integers `n` and `m` — rows and columns.',
        'The next `n` lines each contain `m` space-separated integers.',
    ].join('\n'),
    oneInt: '**Input**\nA single integer `n`.',
    twoInts: '**Input**\nA single line with two space-separated integers `a` and `b`.',
    threeInts: '**Input**\nA single line with three space-separated integers `a`, `b` and `c`.',
    oneStr: '**Input**\nA single line containing a string `s` of lowercase letters.',
    twoStrs: '**Input**\nThe first line contains a string `s`.\nThe second line contains a string `t`.\nBoth consist of lowercase letters.',
    strAndChar: '**Input**\nThe first line contains a string `s` of lowercase letters.\nThe second line contains a single lowercase character `c`.',
};

/* One array of n integers. */
const arrayProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int n, vector<int> arr',
    description: task + '\n\n' + IO.nArray + OUT_ONE,
    constraints: [
        sizeLine('n', opts.maxN || 40, opts.minN || 1),
        rangeLine('arr[i]', opts.lo === undefined ? -40 : opts.lo, opts.hi === undefined ? 80 : opts.hi),
    ],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3
            ? randInt(rng, opts.minN || 1, 5)
            : randInt(rng, Math.max(opts.minN || 1, 5), opts.maxN || 40);
        const lo = opts.lo === undefined ? (caseIdx % 3 === 0 ? -40 : 1) : opts.lo;
        const hi = opts.hi === undefined ? 80 : opts.hi;
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

/* One array plus a parameter k. */
const arrayKProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int n, int k, vector<int> arr',
    description: task + '\n\n' + IO.nkArray + OUT_ONE,
    constraints: [
        sizeLine('n', opts.maxN || 40, 2),
        rangeLine('arr[i]', opts.lo === undefined ? 1 : opts.lo, opts.hi === undefined ? 50 : opts.hi),
    ],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 6) : randInt(rng, 6, opts.maxN || 40);
        const lo = opts.lo === undefined ? 1 : opts.lo;
        const hi = opts.hi === undefined ? 50 : opts.hi;
        let arr = randArray(rng, n, lo, hi);
        if (opts.sorted) arr = arr.sort((a, b) => a - b);
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

/* Two arrays of equal length n. */
const twoArrayProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int n, vector<int> a, vector<int> b',
    description: task + '\n\n' + IO.twoArrays + OUT_ONE,
    constraints: [
        sizeLine('n', opts.maxN || 30),
        rangeLine('a[i], b[i]', opts.lo === undefined ? 1 : opts.lo, opts.hi === undefined ? 40 : opts.hi),
    ],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 5) : randInt(rng, 5, opts.maxN || 30);
        const lo = opts.lo === undefined ? 1 : opts.lo;
        const hi = opts.hi === undefined ? 40 : opts.hi;
        let a = randArray(rng, n, lo, hi);
        let b = randArray(rng, n, lo, hi);
        if (opts.permutation && caseIdx % 2 === 0) {
            // Half the cases make b a genuine shuffle of a so both answers occur.
            b = a.slice();
            for (let i = b.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                const t = b[i]; b[i] = b[j]; b[j] = t;
            }
        }
        if (opts.sorted) { a = a.sort((x, y) => x - y); b = b.sort((x, y) => x - y); }
        return n + '\n' + a.join(' ') + '\n' + b.join(' ') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        const a = r.ints(n);
        const b = r.ints(n);
        return String(solve(a, b, n));
    },
});

/* A single integer. */
const intProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int n',
    description: task + '\n\n' + IO.oneInt + OUT_ONE,
    constraints: [rangeLine('n', opts.range ? opts.range[0] : 1, opts.range ? opts.range[1] : 1000)],
    genInput: (rng, caseIdx) => {
        const lo = opts.range ? opts.range[0] : 1;
        const hi = opts.range ? opts.range[1] : 1000;
        const cap = caseIdx < 3 ? Math.min(hi, lo + 20) : hi;
        return randInt(rng, lo, cap) + '\n';
    },
    solve: (input) => String(solve(reader(input).int())),
});

/* Two integers on one line. */
const pairProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int a, int b',
    description: task + '\n\n' + IO.twoInts + OUT_ONE,
    constraints: [rangeLine('a, b', opts.lo === undefined ? 1 : opts.lo, opts.hi || 100)],
    genInput: (rng, caseIdx) => {
        const lo = opts.lo === undefined ? 1 : opts.lo;
        const hi = caseIdx < 3 ? Math.min(opts.hi || 100, 20) : (opts.hi || 100);
        let a = randInt(rng, lo, hi);
        let b = randInt(rng, opts.bLo === undefined ? lo : opts.bLo, hi);
        if (opts.ordered && a > b) { const t = a; a = b; b = t; }
        return a + ' ' + b + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        return String(solve(r.int(), r.int()));
    },
});

/* Three integers on one line. */
const tripleProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int a, int b, int c',
    description: task + '\n\n' + IO.threeInts + OUT_ONE,
    constraints: [rangeLine('a, b, c', opts.lo === undefined ? 1 : opts.lo, opts.hi || 100)],
    genInput: (rng, caseIdx) => {
        const lo = opts.lo === undefined ? 1 : opts.lo;
        const hi = caseIdx < 3 ? Math.min(opts.hi || 100, 20) : (opts.hi || 100);
        return [0, 0, 0].map(() => randInt(rng, lo, hi)).join(' ') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        return String(solve(r.int(), r.int(), r.int()));
    },
});

/* One lowercase string. */
const strProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'string s',
    description: task + '\n\n' + IO.oneStr + OUT_ONE,
    constraints: [
        sizeLine('s.length', opts.maxN || 40),
        '- `s` consists of lowercase English letters only',
    ],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 6, opts.maxN || 40);
        const alpha = opts.alphabet || (caseIdx % 3 === 0 ? 'ab' : caseIdx % 3 === 1 ? 'abcde' : LOWER);
        return randWord(rng, n, alpha) + '\n';
    },
    solve: (input) => String(solve(reader(input).word())),
});

/* Two lowercase strings on separate lines. */
const twoStrProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'string s, string t',
    description: task + '\n\n' + IO.twoStrs + OUT_ONE,
    constraints: [
        sizeLine('s.length', opts.maxN || 25),
        sizeLine('t.length', opts.maxM || opts.maxN || 25),
        '- `s` and `t` consist of lowercase English letters only',
    ],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 5, opts.maxN || 25);
        const m = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 5, opts.maxM || opts.maxN || 25);
        const alpha = opts.alphabet || 'abcd';
        return randWord(rng, n, alpha) + '\n' + randWord(rng, m, alpha) + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        return String(solve(r.word(), r.word()));
    },
});

/* An n-by-m grid of integers. */
const gridProblem = (difficulty) => (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty,
    returnType: opts.returnType || 'int',
    params: 'int n, int m, vector<vector<int>> grid',
    description: task + '\n\n' + IO.grid + OUT_ONE,
    constraints: [
        sizeLine('n, m', opts.maxDim || 8),
        rangeLine('grid[i][j]', opts.lo === undefined ? 1 : opts.lo, opts.hi === undefined ? 40 : opts.hi),
    ],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 3, opts.maxDim || 8);
        const m = opts.square ? n : (caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 3, opts.maxDim || 8));
        const rows = [];
        for (let i = 0; i < n; i++) {
            rows.push(randArray(rng, m, opts.lo === undefined ? 1 : opts.lo, opts.hi === undefined ? 40 : opts.hi).join(' '));
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

module.exports = { IO, OUT_ONE, arrayProblem, arrayKProblem, twoArrayProblem, intProblem, pairProblem, tripleProblem, strProblem, twoStrProblem, gridProblem };
