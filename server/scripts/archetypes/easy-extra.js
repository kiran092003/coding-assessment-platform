/* ───────────────────────────────────────────────────────────────────────────
   Additional easy ("Low") archetypes, built on the shared factories.
   ─────────────────────────────────────────────────────────────────────────── */

const F = require('../lib/factories');
const { randInt, randArray, randWord, reader, fixed, LOWER } = require('../lib/util');

const arr = F.arrayProblem('Low');
const arrK = F.arrayKProblem('Low');
const two = F.twoArrayProblem('Low');
const int1 = F.intProblem('Low');
const pair = F.pairProblem('Low');
const triple = F.tripleProblem('Low');
const str1 = F.strProblem('Low');
const str2 = F.twoStrProblem('Low');
const grid = F.gridProblem('Low');

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/* ── Two arrays ────────────────────────────────────────────────────────── */

const twoArrays = [
    two('dot-product', 'Dot Product',
        'Print the sum of a[i] * b[i] over every index i.',
        (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), { returnType: 'long long' }),

    two('elementwise-sum', 'Element-wise Sum',
        'Print the array whose i-th value is a[i] + b[i], separated by single spaces.',
        (a, b) => a.map((x, i) => x + b[i]).join(' '), { returnType: 'vector<int>' }),

    two('elementwise-max', 'Element-wise Maximum',
        'Print the array whose i-th value is the larger of a[i] and b[i], separated by single spaces.',
        (a, b) => a.map((x, i) => Math.max(x, b[i])).join(' '), { returnType: 'vector<int>' }),

    two('count-common-values', 'Shared Values',
        'Print how many distinct values appear in both arrays.',
        (a, b) => {
            const sa = new Set(a);
            let c = 0;
            for (const x of new Set(b)) if (sa.has(x)) c++;
            return c;
        }, { hi: 15 }),

    two('union-size', 'Size of the Union',
        'Print how many distinct values appear in at least one of the two arrays.',
        (a, b) => new Set(a.concat(b)).size, { hi: 15 }),

    two('is-permutation', 'Permutation Check',
        'Print 1 if b is a rearrangement of a, 0 otherwise.',
        (a, b) => {
            const x = a.slice().sort((p, q) => p - q).join(',');
            const y = b.slice().sort((p, q) => p - q).join(',');
            return x === y ? 1 : 0;
        }, { permutation: true, hi: 10 }),

    two('hamming-distance-array', 'Positions That Differ',
        'Print how many indices i satisfy a[i] != b[i].',
        (a, b) => a.reduce((s, x, i) => s + (x !== b[i] ? 1 : 0), 0), { hi: 6 }),

    two('count-a-greater', 'Wins for the First Array',
        'Print how many indices i satisfy a[i] > b[i].',
        (a, b) => a.reduce((s, x, i) => s + (x > b[i] ? 1 : 0), 0)),

    two('merge-sorted-arrays', 'Merge Two Sorted Arrays',
        'Both arrays are sorted in non-decreasing order. Print all 2n values merged into one non-decreasing sequence, separated by single spaces.',
        (a, b) => a.concat(b).sort((x, y) => x - y).join(' '),
        { sorted: true, returnType: 'vector<int>' }),

    two('max-pair-sum-index', 'Best Combined Index',
        'Print the 0-based index i that maximises a[i] + b[i]. If several tie, print the smallest index.',
        (a, b) => {
            let best = -Infinity;
            let idx = 0;
            for (let i = 0; i < a.length; i++) {
                if (a[i] + b[i] > best) { best = a[i] + b[i]; idx = i; }
            }
            return idx;
        }),

    two('first-difference-index', 'First Differing Position',
        'Print the smallest 0-based index where the two arrays differ, or -1 if they are identical.',
        (a, b) => {
            for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
            return -1;
        }, { hi: 4 }),

    two('swap-count-to-match', 'Multiset Difference',
        'Print how many values of a (counting repeats) cannot be matched with an equal value in b.',
        (a, b) => {
            const f = new Map();
            for (const x of b) f.set(x, (f.get(x) || 0) + 1);
            let unmatched = 0;
            for (const x of a) {
                if (f.get(x) > 0) f.set(x, f.get(x) - 1);
                else unmatched++;
            }
            return unmatched;
        }, { hi: 8 }),
];

/* ── Easy matrices ─────────────────────────────────────────────────────── */

const matrices = [
    grid('matrix-total-sum', 'Sum of a Grid',
        'Print the sum of every entry in the grid.',
        (g) => g.reduce((s, row) => s + row.reduce((t, x) => t + x, 0), 0), { returnType: 'long long' }),

    grid('matrix-row-sums', 'Row Sums',
        'Print the sum of each row, in order, separated by single spaces.',
        (g) => g.map((row) => row.reduce((s, x) => s + x, 0)).join(' '), { returnType: 'vector<int>' }),

    grid('matrix-column-max', 'Column Maximums',
        'Print the largest value in each column, in order, separated by single spaces.',
        (g, n, m) => {
            const out = [];
            for (let j = 0; j < m; j++) {
                let best = -Infinity;
                for (let i = 0; i < n; i++) if (g[i][j] > best) best = g[i][j];
                out.push(best);
            }
            return out.join(' ');
        }, { returnType: 'vector<int>' }),

    grid('matrix-is-identity', 'Identity Matrix Check',
        'The grid is square. Print 1 if it is the identity matrix, 0 otherwise.',
        (g, n) => {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const want = i === j ? 1 : 0;
                    if (g[i][j] !== want) return 0;
                }
            }
            return 1;
        }, { square: true, lo: 0, hi: 1 }),

    grid('matrix-is-symmetric', 'Symmetric Matrix Check',
        'The grid is square. Print 1 if it equals its own transpose, 0 otherwise.',
        (g, n) => {
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) if (g[i][j] !== g[j][i]) return 0;
            }
            return 1;
        }, { square: true, lo: 0, hi: 2 }),

    grid('matrix-count-zeros', 'Count Zero Entries',
        'Print how many entries of the grid are zero.',
        (g) => g.reduce((s, row) => s + row.filter((x) => x === 0).length, 0), { lo: 0, hi: 3 }),

    grid('matrix-border-sum', 'Sum of the Border',
        'Print the sum of the entries on the outer border of the grid. Each border cell counts once.',
        (g, n, m) => {
            let s = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (i === 0 || j === 0 || i === n - 1 || j === m - 1) s += g[i][j];
                }
            }
            return s;
        }, { returnType: 'long long' }),

    grid('matrix-main-diagonal', 'Main Diagonal',
        'The grid is square. Print the entries on the main diagonal, separated by single spaces.',
        (g, n) => {
            const out = [];
            for (let i = 0; i < n; i++) out.push(g[i][i]);
            return out.join(' ');
        }, { square: true, returnType: 'vector<int>' }),
];

/* ── Bit manipulation ──────────────────────────────────────────────────── */

const bits = [
    arr('array-and-all', 'Bitwise AND of an Array',
        'Print the bitwise AND of every element.',
        (a) => a.reduce((x, y) => x & y), { lo: 0, hi: 255 }),

    arr('array-or-all', 'Bitwise OR of an Array',
        'Print the bitwise OR of every element.',
        (a) => a.reduce((x, y) => x | y), { lo: 0, hi: 255 }),

    arr('array-xor-all', 'Bitwise XOR of an Array',
        'Print the bitwise XOR of every element.',
        (a) => a.reduce((x, y) => x ^ y), { lo: 0, hi: 255 }),

    arr('find-single-odd-occurrence', 'The Unpaired Value',
        'Every value appears an even number of times except one. Print the value that appears an odd number of times.',
        (a) => a.reduce((x, y) => x ^ y, 0), { lo: 1, hi: 20 }),

    pair('toggle-kth-bit', 'Toggle a Bit',
        'Print the value obtained by flipping bit b of a. Bits are numbered from 0 at the least significant end.',
        (a, b) => a ^ (1 << b), { lo: 0, hi: 1000, bLo: 0 }),

    int1('bit-parity', 'Parity of the Set Bits',
        'Print 1 if n has an odd number of 1 bits in binary, 0 otherwise.',
        (n) => n.toString(2).split('').filter((c) => c === '1').length % 2,
        { range: [0, 1000000000] }),

    int1('highest-power-of-two', 'Largest Power of Two',
        'Print the largest power of two that is less than or equal to n.',
        (n) => Math.pow(2, Math.floor(Math.log2(n))), { range: [1, 1000000000] }),

    int1('to-binary-string', 'Binary Representation',
        'Print the binary representation of n with no leading zeros.',
        (n) => n.toString(2), { range: [0, 1000000], returnType: 'string' }),
];

/* ── Small-number logic ────────────────────────────────────────────────── */

const numbers = [
    triple('max-of-three', 'Largest of Three',
        'Print the largest of the three values.',
        (a, b, c) => Math.max(a, b, c), { lo: -100 }),

    triple('min-of-three', 'Smallest of Three',
        'Print the smallest of the three values.',
        (a, b, c) => Math.min(a, b, c), { lo: -100 }),

    triple('sort-three', 'Sort Three Numbers',
        'Print the three values in non-decreasing order, separated by single spaces.',
        (a, b, c) => [a, b, c].sort((x, y) => x - y).join(' '), { returnType: 'vector<int>' }),

    triple('triangle-valid', 'Triangle Inequality',
        'Print 1 if three segments of these lengths can form a triangle with positive area, 0 otherwise.',
        (a, b, c) => {
            const s = [a, b, c].sort((x, y) => x - y);
            return s[0] + s[1] > s[2] ? 1 : 0;
        }),

    triple('triangle-type', 'Classify a Triangle',
        'The three values are side lengths of a valid triangle. Print 3 if it is equilateral, 2 if isosceles, and 1 if scalene.',
        (a, b, c) => {
            if (a === b && b === c) return 3;
            if (a === b || b === c || a === c) return 2;
            return 1;
        }, { hi: 5 }),

    pair('abs-difference', 'Absolute Difference',
        'Print the absolute difference between a and b.',
        (a, b) => Math.abs(a - b), { lo: -500, hi: 500 }),

    pair('ceil-division', 'Ceiling Division',
        'Print a divided by b, rounded up to the nearest integer. Both values are positive.',
        (a, b) => Math.ceil(a / b)),

    pair('clamp-value', 'Clamp to a Bound',
        'Print a if it is at most b, otherwise print b.',
        (a, b) => Math.min(a, b), { lo: -100 }),

    pair('reduce-fraction', 'Reduce a Fraction',
        'Print the fraction a/b in lowest terms as two space-separated integers: the numerator then the denominator.',
        (a, b) => {
            const g = gcd(a, b);
            return (a / g) + ' ' + (b / g);
        }, { returnType: 'vector<int>' }),

    int1('triangular-number', 'Nth Triangular Number',
        'Print the sum of the integers from 1 to n.',
        (n) => (n * (n + 1)) / 2, { range: [1, 100000], returnType: 'long long' }),

    int1('sum-first-n-odds', 'Sum of the First N Odd Numbers',
        'Print the sum of the first n odd positive integers.',
        (n) => n * n, { range: [1, 100000], returnType: 'long long' }),

    int1('is-leap-year', 'Leap Year',
        'Print 1 if the year n is a leap year in the Gregorian calendar, 0 otherwise.',
        (n) => ((n % 4 === 0 && n % 100 !== 0) || n % 400 === 0 ? 1 : 0),
        { range: [1, 4000] }),

    int1('count-fizzbuzz', 'Multiples of Three or Five',
        'Print how many integers in the range [1, n] are divisible by 3 or by 5.',
        (n) => Math.floor(n / 3) + Math.floor(n / 5) - Math.floor(n / 15),
        { range: [1, 1000000] }),

    int1('square-root-floor', 'Integer Square Root',
        'Print the largest integer whose square is at most n.',
        (n) => Math.floor(Math.sqrt(n)), { range: [0, 1000000000] }),

    int1('is-fibonacci', 'Fibonacci Membership',
        'Print 1 if n appears in the Fibonacci sequence, 0 otherwise.',
        (n) => {
            let a = 0;
            let b = 1;
            while (a < n) { const t = a + b; a = b; b = t; }
            return a === n ? 1 : 0;
        }, { range: [0, 1000000] }),

    pair('average-two-precise', 'Mean of Two Values',
        'Print the mean of a and b with exactly four digits after the decimal point.',
        (a, b) => fixed((a + b) / 2, 4), { returnType: 'double', lo: -1000, hi: 1000 }),

    triple('average-three-precise', 'Mean of Three Values',
        'Print the mean of the three values with exactly four digits after the decimal point.',
        (a, b, c) => fixed((a + b + c) / 3, 4), { returnType: 'double' }),
];

/* ── More arrays ───────────────────────────────────────────────────────── */

const moreArrays = [
    arr('count-above-average', 'Above Average',
        'Print how many elements are strictly greater than the mean of the array.',
        (a) => {
            const avg = a.reduce((s, x) => s + x, 0) / a.length;
            return a.filter((x) => x > avg).length;
        }),

    arr('clamp-negatives', 'Clamp the Negatives',
        'Print the array with every negative value replaced by 0, separated by single spaces.',
        (a) => a.map((x) => (x < 0 ? 0 : x)).join(' '),
        { lo: -40, returnType: 'vector<int>' }),

    arr('running-max', 'Running Maximum',
        'Print the running maximum: the i-th value printed is the largest among the first i+1 elements.',
        (a) => {
            const out = [];
            let best = -Infinity;
            for (const x of a) { if (x > best) best = x; out.push(best); }
            return out.join(' ');
        }, { returnType: 'vector<int>' }),

    arr('count-peaks', 'Count the Peaks',
        'Print how many elements are strictly greater than both of their neighbours. The first and last elements are never peaks.',
        (a) => {
            let c = 0;
            for (let i = 1; i + 1 < a.length; i++) if (a[i] > a[i - 1] && a[i] > a[i + 1]) c++;
            return c;
        }),

    arr('is-sorted', 'Sorted Check',
        'Print 1 if the array is in non-decreasing order, 0 otherwise.',
        (a) => {
            for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) return 0;
            return 1;
        }, { hi: 10 }),

    arr('rotate-by-one', 'Rotate Left by One',
        'Print the array rotated one position to the left, separated by single spaces.',
        (a) => a.slice(1).concat(a.slice(0, 1)).join(' '), { returnType: 'vector<int>' }),

    arr('sum-of-squares-array', 'Sum of Squares',
        'Print the sum of the squares of the elements.',
        (a) => a.reduce((s, x) => s + x * x, 0), { lo: -30, hi: 30, returnType: 'long long' }),

    arr('count-duplicates', 'Values That Repeat',
        'Print how many distinct values occur more than once in the array.',
        (a) => {
            const f = {};
            for (const x of a) f[x] = (f[x] || 0) + 1;
            return Object.values(f).filter((c) => c > 1).length;
        }, { hi: 12 }),

    arr('mean-rounded', 'Mean of an Array',
        'Print the mean of the elements with exactly four digits after the decimal point.',
        (a) => fixed(a.reduce((s, x) => s + x, 0) / a.length, 4), { returnType: 'double' }),

    arrK('sum-first-k', 'Sum of the First K Elements',
        'Print the sum of the first k elements. You may assume k is at most n.',
        (a, k) => a.slice(0, k).reduce((s, x) => s + x, 0), { returnType: 'long long' }),

    arrK('count-greater-than-k', 'Count Above a Threshold',
        'Print how many elements are strictly greater than k.',
        (a, k) => a.filter((x) => x > k).length, { genK: (rng) => randInt(rng, 1, 50) }),

    arrK('index-of-value', 'Linear Search',
        'Print the smallest 0-based index at which the value k occurs, or -1 if it does not occur.',
        (a, k) => {
            const i = a.indexOf(k);
            return i;
        }, { genK: (rng) => randInt(rng, 1, 20), hi: 20 }),

    arrK('count-occurrences-of-k', 'Count Occurrences',
        'Print how many times the value k occurs in the array.',
        (a, k) => a.filter((x) => x === k).length,
        { genK: (rng) => randInt(rng, 1, 12), hi: 12 }),

    arrK('closest-to-k', 'Closest Element',
        'Print the element whose value is closest to k. If two are equally close, print the smaller one.',
        (a, k) => {
            let best = a[0];
            for (const x of a) {
                const d = Math.abs(x - k);
                const bd = Math.abs(best - k);
                if (d < bd || (d === bd && x < best)) best = x;
            }
            return best;
        }, { genK: (rng) => randInt(rng, 1, 50) }),
];

/* ── More strings ──────────────────────────────────────────────────────── */

const moreStrings = [
    str1('to-upper-case', 'Upper Case',
        'Print s with every letter converted to upper case.',
        (s) => s.toUpperCase(), { returnType: 'string', alphabet: LOWER }),

    str1('remove-vowels', 'Remove the Vowels',
        'Print s with every vowel removed. Print -1 if no characters remain.',
        (s) => {
            const kept = s.split('').filter((c) => 'aeiou'.indexOf(c) === -1).join('');
            // An empty line would be ambiguous to compare against stdout.
            return kept.length ? kept : '-1';
        },
        { returnType: 'string', alphabet: LOWER }),

    str1('string-length', 'Length of a String',
        'Print the number of characters in s.',
        (s) => s.length),

    str1('alternate-case', 'Alternating Case',
        'Print s with the characters at even indices in upper case and the rest unchanged. Indices are 0-based.',
        (s) => s.split('').map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c)).join(''),
        { returnType: 'string', alphabet: LOWER }),

    str1('middle-character', 'Middle Character',
        'Print the middle character of s if its length is odd, or the two middle characters if it is even.',
        (s) => (s.length % 2 ? s[(s.length - 1) / 2] : s.slice(s.length / 2 - 1, s.length / 2 + 1)),
        { returnType: 'string' }),

    str1('count-char-pairs', 'Adjacent Duplicate Pairs',
        'Print how many adjacent character pairs consist of the same letter twice.',
        (s) => {
            let c = 0;
            for (let i = 0; i + 1 < s.length; i++) if (s[i] === s[i + 1]) c++;
            return c;
        }, { alphabet: 'ab' }),

    str1('lexicographically-smallest-char', 'Smallest Character',
        'Print the alphabetically smallest character in s.',
        (s) => s.split('').sort()[0], { returnType: 'string' }),

    str2('concat-length', 'Combined Length',
        'Print the total number of characters in s and t together.',
        (s, t) => s.length + t.length),

    str2('starts-with', 'Prefix Check',
        'Print 1 if s begins with t, 0 otherwise.',
        (s, t) => (s.indexOf(t) === 0 ? 1 : 0), { alphabet: 'ab', maxM: 4 }),

    str2('ends-with', 'Suffix Check',
        'Print 1 if s ends with t, 0 otherwise.',
        (s, t) => (t.length <= s.length && s.slice(s.length - t.length) === t ? 1 : 0),
        { alphabet: 'ab', maxM: 4 }),

    str2('lexicographic-min', 'Alphabetical Order',
        'Print whichever of s and t comes first alphabetically. If they are equal, print either.',
        (s, t) => (s <= t ? s : t), { returnType: 'string' }),

    str2('longest-common-prefix-two', 'Longest Common Prefix',
        'Print the length of the longest common prefix of s and t.',
        (s, t) => {
            let i = 0;
            while (i < s.length && i < t.length && s[i] === t[i]) i++;
            return i;
        }, { alphabet: 'abc' }),

    {
        slug: 'count-given-char',
        title: 'Count a Given Character',
        difficulty: 'Low',
        returnType: 'int',
        params: 'string s, char c',
        description: 'Print how many times the character c occurs in s.\n\n' + F.IO.strAndChar + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 6, 40);
            const alpha = 'abcde';
            return randWord(rng, n, alpha) + '\n' + alpha[Math.floor(rng() * alpha.length)] + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const s = r.word();
            const c = r.word();
            return String(s.split('').filter((x) => x === c).length);
        },
    },
    {
        slug: 'repeat-string',
        title: 'Repeat a String',
        difficulty: 'Low',
        returnType: 'string',
        params: 'string s, int k',
        description: 'Print s repeated k times with no separator.\n\n**Input**\nThe first line contains a string `s` of lowercase letters.\nThe second line contains an integer `k`.' + F.OUT_ONE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 2, 10);
            return randWord(rng, n, 'abc') + '\n' + randInt(rng, 1, 8) + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const s = r.word();
            const k = r.int();
            return s.repeat(k);
        },
    },
];

module.exports = [].concat(twoArrays, matrices, bits, numbers, moreArrays, moreStrings);
