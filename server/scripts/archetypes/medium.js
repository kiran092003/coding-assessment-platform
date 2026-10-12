/* ───────────────────────────────────────────────────────────────────────────
   Medium (difficulty "Medium") archetypes.

   Each entry is a self-contained problem: statement, input generator, and a
   reference solution that produces the expected output. Input sizes are kept
   inside what the 5 s / 256 MB sandbox comfortably handles.
   ─────────────────────────────────────────────────────────────────────────── */

const { randInt, randArray, randWord, reader, LOWER } = require('../lib/util');

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

const ONE_LINE = '\n\n**Output**\nPrint the answer on one line.';

/* Shorthand for a problem over one array of n integers. */
const arrayProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'int n, vector<int> arr',
    description: task + '\n\n' + IO_N_ARRAY + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 8, opts.maxN || 60);
        const lo = opts.lo === undefined ? (caseIdx % 3 === 0 ? -40 : 1) : opts.lo;
        const hi = opts.hi === undefined ? 80 : opts.hi;
        let arr = randArray(rng, n, lo, hi);
        if (opts.sorted) arr = arr.sort((a, b) => a - b);
        return n + '\n' + arr.join(' ') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        return String(solve(r.ints(n)));
    },
});

/* Shorthand for a problem over an array plus a parameter k. */
const arrayKProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'int n, int k, vector<int> arr',
    description: task + '\n\n' + IO_N_K_ARRAY + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 6) : randInt(rng, 8, opts.maxN || 50);
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
        return String(solve(r.ints(n), k));
    },
});

/* ── Arrays and sorting ────────────────────────────────────────────────── */

const arrays = [
    arrayProblem(
        'sort-ascending', 'Sort an Array',
        'Print the elements of the array in non-decreasing order, separated by single spaces.',
        (a) => a.slice().sort((x, y) => x - y).join(' '),
        { returnType: 'vector<int>' },
    ),
    arrayProblem(
        'sort-descending', 'Sort an Array Descending',
        'Print the elements of the array in non-increasing order, separated by single spaces.',
        (a) => a.slice().sort((x, y) => y - x).join(' '),
        { returnType: 'vector<int>' },
    ),
    arrayProblem(
        'max-subarray-sum', 'Maximum Subarray Sum',
        'Find the largest sum obtainable from a contiguous non-empty subarray.',
        (a) => {
            let best = a[0];
            let cur = a[0];
            for (let i = 1; i < a.length; i++) {
                cur = Math.max(a[i], cur + a[i]);
                best = Math.max(best, cur);
            }
            return best;
        },
        { lo: -40 },
    ),
    arrayProblem(
        'max-profit', 'Best Time to Buy and Sell',
        'Element i is the price on day i. Choose a buy day before a sell day to maximise profit. Print the maximum profit, or 0 if no profitable trade exists.',
        (a) => {
            let min = Infinity;
            let best = 0;
            for (const x of a) {
                if (x < min) min = x;
                if (x - min > best) best = x - min;
            }
            return best;
        },
        { lo: 1 },
    ),
    arrayProblem(
        'longest-increasing-run', 'Longest Increasing Run',
        'Print the length of the longest strictly increasing contiguous block.',
        (a) => {
            let best = 1;
            let run = 1;
            for (let i = 1; i < a.length; i++) {
                run = a[i] > a[i - 1] ? run + 1 : 1;
                if (run > best) best = run;
            }
            return best;
        },
    ),
    arrayProblem(
        'majority-element', 'Majority Element',
        'Print the value that appears strictly more than n/2 times, or -1 if no such value exists.',
        (a) => {
            let cand = a[0];
            let cnt = 0;
            for (const x of a) {
                if (cnt === 0) { cand = x; cnt = 1; }
                else cnt += x === cand ? 1 : -1;
            }
            const occ = a.filter((x) => x === cand).length;
            return occ * 2 > a.length ? cand : -1;
        },
        { hi: 4 },
    ),
    arrayProblem(
        'equilibrium-index', 'Equilibrium Index',
        'Print the smallest index i where the sum of the elements before i equals the sum of the elements after i, or -1 if there is none. Indices are 0-based.',
        (a) => {
            const total = a.reduce((s, x) => s + x, 0);
            let left = 0;
            for (let i = 0; i < a.length; i++) {
                if (left === total - left - a[i]) return i;
                left += a[i];
            }
            return -1;
        },
        { lo: -10, hi: 10 },
    ),
    arrayProblem(
        'count-inversions', 'Count Inversions',
        'Count the index pairs (i, j) with i < j and a[i] > a[j].',
        (a) => {
            let c = 0;
            for (let i = 0; i < a.length; i++) {
                for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) c++;
            }
            return c;
        },
        { maxN: 50 },
    ),
    arrayProblem(
        'smallest-missing-positive', 'Smallest Missing Positive',
        'Print the smallest positive integer that does not appear in the array.',
        (a) => {
            const s = new Set(a);
            let i = 1;
            while (s.has(i)) i++;
            return i;
        },
        { lo: -5, hi: 20 },
    ),
    arrayProblem(
        'move-zeros', 'Move Zeros to the End',
        'Print the array with every zero moved to the end, with the order of the non-zero elements unchanged.',
        (a) => a.filter((x) => x !== 0).concat(a.filter((x) => x === 0)).join(' '),
        { returnType: 'vector<int>', lo: 0, hi: 3 },
    ),
    arrayProblem(
        'max-product-pair', 'Maximum Product of Two Elements',
        'Print the largest product obtainable from two distinct positions of the array.',
        (a) => {
            const s = a.slice().sort((x, y) => x - y);
            const n = s.length;
            return Math.max(s[0] * s[1], s[n - 1] * s[n - 2]);
        },
        { lo: -30, hi: 30, returnType: 'long long' },
    ),
    arrayProblem(
        'median-of-array', 'Median of an Array',
        'Print the median. For an even count, print the mean of the two middle values rounded down to an integer.',
        (a) => {
            const s = a.slice().sort((x, y) => x - y);
            const n = s.length;
            return n % 2 ? s[(n - 1) / 2] : Math.floor((s[n / 2 - 1] + s[n / 2]) / 2);
        },
    ),
    arrayProblem(
        'min-moves-equal', 'Minimum Moves to Equalise',
        'Each move changes one element by 1. Print the fewest moves needed to make all elements equal.',
        (a) => {
            const s = a.slice().sort((x, y) => x - y);
            const med = s[Math.floor(s.length / 2)];
            return s.reduce((acc, x) => acc + Math.abs(x - med), 0);
        },
        { lo: 1, hi: 60, returnType: 'long long' },
    ),
    arrayProblem(
        'count-distinct-pairs-diff', 'Pairs with Equal Values',
        'Count the index pairs (i, j) with i < j and a[i] == a[j].',
        (a) => {
            const f = {};
            for (const x of a) f[x] = (f[x] || 0) + 1;
            return Object.values(f).reduce((s, c) => s + (c * (c - 1)) / 2, 0);
        },
        { hi: 10 },
    ),
    arrayKProblem(
        'kth-smallest', 'Kth Smallest Element',
        'Print the k-th smallest element of the array. k is 1-based.',
        (a, k) => a.slice().sort((x, y) => x - y)[k - 1],
    ),
    arrayKProblem(
        'kth-largest', 'Kth Largest Element',
        'Print the k-th largest element of the array. k is 1-based.',
        (a, k) => a.slice().sort((x, y) => y - x)[k - 1],
    ),
    arrayKProblem(
        'count-pairs-sum-k', 'Pairs with a Given Sum',
        'Count the index pairs (i, j) with i < j and a[i] + a[j] == k.',
        (a, k) => {
            let c = 0;
            for (let i = 0; i < a.length; i++) {
                for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === k) c++;
            }
            return c;
        },
        { genK: (rng) => randInt(rng, 2, 100), hi: 50 },
    ),
    arrayKProblem(
        'window-max-sum', 'Maximum Sum of a Window',
        'Print the largest sum of k consecutive elements. You may assume k is at most n.',
        (a, k) => {
            let cur = 0;
            for (let i = 0; i < k; i++) cur += a[i];
            let best = cur;
            for (let i = k; i < a.length; i++) {
                cur += a[i] - a[i - k];
                if (cur > best) best = cur;
            }
            return best;
        },
        { genK: (rng, n) => randInt(rng, 1, n) },
    ),
    arrayKProblem(
        'rotate-array', 'Rotate an Array',
        'Rotate the array right by k positions and print the result, separated by single spaces.',
        (a, k) => {
            const n = a.length;
            const s = k % n;
            return a.slice(n - s).concat(a.slice(0, n - s)).join(' ');
        },
        { returnType: 'vector<int>', genK: (rng, n) => randInt(rng, 0, 2 * n) },
    ),
    arrayKProblem(
        'subarray-sum-count', 'Subarrays with a Given Sum',
        'Count the contiguous non-empty subarrays whose elements sum to exactly k.',
        (a, k) => {
            let c = 0;
            for (let i = 0; i < a.length; i++) {
                let s = 0;
                for (let j = i; j < a.length; j++) {
                    s += a[j];
                    if (s === k) c++;
                }
            }
            return c;
        },
        { genK: (rng) => randInt(rng, 1, 40), hi: 15, maxN: 50 },
    ),
    arrayKProblem(
        'longest-window-sum-at-most', 'Longest Window with Bounded Sum',
        'Print the length of the longest contiguous block whose sum is at most k. Print 0 if no non-empty block qualifies.',
        (a, k) => {
            let best = 0;
            let s = 0;
            let l = 0;
            for (let rIdx = 0; rIdx < a.length; rIdx++) {
                s += a[rIdx];
                while (s > k && l <= rIdx) { s -= a[l]; l++; }
                if (rIdx - l + 1 > best) best = rIdx - l + 1;
            }
            return best;
        },
        { genK: (rng) => randInt(rng, 5, 200), hi: 30 },
    ),
    arrayProblem(
        'remove-duplicates-sorted', 'Distinct Values in Order',
        'The array is sorted in non-decreasing order. Print its distinct values in the same order, separated by single spaces.',
        (a) => Array.from(new Set(a)).join(' '),
        { returnType: 'vector<int>', sorted: true, hi: 20 },
    ),
    arrayProblem(
        'prefix-sum-print', 'Prefix Sums',
        'Print the running totals of the array: the i-th value printed is the sum of the first i+1 elements.',
        (a) => {
            const out = [];
            let s = 0;
            for (const x of a) { s += x; out.push(s); }
            return out.join(' ');
        },
        { returnType: 'vector<int>' },
    ),
];

/* ── Strings ───────────────────────────────────────────────────────────── */

const STR_ONE = [
    '**Input**',
    'A single line containing a string `s` of lowercase letters.',
].join('\n');

const STR_TWO = [
    '**Input**',
    'The first line contains a string `s`.',
    'The second line contains a string `t`.',
    'Both consist of lowercase letters.',
].join('\n');

const strProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'string s',
    description: task + '\n\n' + STR_ONE + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 7) : randInt(rng, 8, opts.maxN || 40);
        const alpha = opts.alphabet || (caseIdx % 2 === 0 ? 'abc' : LOWER);
        return randWord(rng, n, alpha) + '\n';
    },
    solve: (input) => String(solve(reader(input).word())),
});

const twoStrProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'string s, string t',
    description: task + '\n\n' + STR_TWO + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 2, 6) : randInt(rng, 5, opts.maxN || 25);
        const m = caseIdx < 3 ? randInt(rng, 2, 6) : randInt(rng, 5, opts.maxN || 25);
        const alpha = opts.alphabet || 'abcd';
        return randWord(rng, n, alpha) + '\n' + randWord(rng, m, alpha) + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        return String(solve(r.word(), r.word()));
    },
});

const strings = [
    strProblem(
        'count-palindromic-substrings', 'Count Palindromic Substrings',
        'Count the non-empty substrings of s that are palindromes. Substrings at different positions count separately.',
        (s) => {
            let c = 0;
            for (let i = 0; i < s.length; i++) {
                for (let j = i; j < s.length; j++) {
                    const sub = s.slice(i, j + 1);
                    if (sub === sub.split('').reverse().join('')) c++;
                }
            }
            return c;
        },
        { maxN: 40 },
    ),
    strProblem(
        'longest-palindromic-substring-len', 'Longest Palindromic Substring',
        'Print the length of the longest palindromic substring of s.',
        (s) => {
            let best = 0;
            for (let i = 0; i < s.length; i++) {
                for (let j = i; j < s.length; j++) {
                    const sub = s.slice(i, j + 1);
                    if (sub === sub.split('').reverse().join('') && sub.length > best) best = sub.length;
                }
            }
            return best;
        },
        { maxN: 40 },
    ),
    strProblem(
        'longest-unique-window', 'Longest Substring Without Repeats',
        'Print the length of the longest substring of s that contains no repeated character.',
        (s) => {
            const last = new Map();
            let best = 0;
            let start = 0;
            for (let i = 0; i < s.length; i++) {
                if (last.has(s[i]) && last.get(s[i]) >= start) start = last.get(s[i]) + 1;
                last.set(s[i], i);
                if (i - start + 1 > best) best = i - start + 1;
            }
            return best;
        },
    ),
    strProblem(
        'min-deletions-palindrome-chars', 'Deletions to Permute into a Palindrome',
        'Print the minimum number of characters to delete so the remaining characters can be rearranged into a palindrome.',
        (s) => {
            const f = {};
            for (const c of s) f[c] = (f[c] || 0) + 1;
            const odd = Object.values(f).filter((x) => x % 2 === 1).length;
            return odd === 0 ? 0 : odd - 1;
        },
    ),
    strProblem(
        'caesar-shift-three', 'Caesar Cipher',
        'Shift every letter of s forward by 3 positions in the alphabet, wrapping z to c. Print the result.',
        (s) => s.split('').map((c) => LOWER[(LOWER.indexOf(c) + 3) % 26]).join(''),
        { returnType: 'string', alphabet: LOWER },
    ),
    strProblem(
        'char-frequency-report', 'Highest Character Frequency',
        'Print the number of occurrences of the most frequent character in s.',
        (s) => {
            const f = {};
            for (const c of s) f[c] = (f[c] || 0) + 1;
            return Math.max.apply(null, Object.values(f));
        },
    ),
    strProblem(
        'count-distinct-substrings', 'Count Distinct Substrings',
        'Count the distinct non-empty substrings of s.',
        (s) => {
            const set = new Set();
            for (let i = 0; i < s.length; i++) {
                for (let j = i; j < s.length; j++) set.add(s.slice(i, j + 1));
            }
            return set.size;
        },
        { maxN: 35 },
    ),
    strProblem(
        'balanced-brackets', 'Balanced Brackets',
        'The string consists only of the characters a and b, where a opens a bracket and b closes one. Print 1 if the sequence is balanced, 0 otherwise.',
        (s) => {
            let d = 0;
            for (const c of s) {
                d += c === 'a' ? 1 : -1;
                if (d < 0) return 0;
            }
            return d === 0 ? 1 : 0;
        },
        { alphabet: 'ab' },
    ),
    twoStrProblem(
        'is-anagram', 'Anagram Check',
        'Print 1 if s and t are anagrams of each other, 0 otherwise.',
        (s, t) => (s.split('').sort().join('') === t.split('').sort().join('') ? 1 : 0),
    ),
    twoStrProblem(
        'lcs-length', 'Longest Common Subsequence',
        'Print the length of the longest common subsequence of s and t.',
        (s, t) => {
            const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
            for (let i = 1; i <= s.length; i++) {
                for (let j = 1; j <= t.length; j++) {
                    dp[i][j] = s[i - 1] === t[j - 1]
                        ? dp[i - 1][j - 1] + 1
                        : Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
            return dp[s.length][t.length];
        },
    ),
    twoStrProblem(
        'edit-distance', 'Edit Distance',
        'Print the minimum number of single-character insertions, deletions or substitutions needed to turn s into t.',
        (s, t) => {
            const dp = Array.from({ length: s.length + 1 }, (_, i) =>
                Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
            for (let i = 1; i <= s.length; i++) {
                for (let j = 1; j <= t.length; j++) {
                    dp[i][j] = s[i - 1] === t[j - 1]
                        ? dp[i - 1][j - 1]
                        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
                }
            }
            return dp[s.length][t.length];
        },
    ),
    twoStrProblem(
        'count-occurrences-substring', 'Count Substring Occurrences',
        'Count how many times t occurs in s as a contiguous substring. Occurrences may overlap.',
        (s, t) => {
            let c = 0;
            for (let i = 0; i + t.length <= s.length; i++) {
                if (s.slice(i, i + t.length) === t) c++;
            }
            return c;
        },
        { alphabet: 'ab', maxN: 30 },
    ),
    twoStrProblem(
        'is-subsequence', 'Subsequence Check',
        'Print 1 if t is a subsequence of s, 0 otherwise.',
        (s, t) => {
            let j = 0;
            for (const c of s) if (j < t.length && c === t[j]) j++;
            return j === t.length ? 1 : 0;
        },
        { alphabet: 'abc' },
    ),
    twoStrProblem(
        'is-rotation', 'String Rotation',
        'Print 1 if t is a rotation of s, 0 otherwise.',
        (s, t) => (s.length === t.length && (s + s).indexOf(t) !== -1 ? 1 : 0),
        { alphabet: 'abc' },
    ),
    twoStrProblem(
        'common-chars-count', 'Shared Characters',
        'Print how many distinct characters appear in both s and t.',
        (s, t) => {
            const a = new Set(s);
            let c = 0;
            for (const ch of new Set(t)) if (a.has(ch)) c++;
            return c;
        },
    ),
];

/* ── Number theory and maths ───────────────────────────────────────────── */

const IO_ONE_INT = '**Input**\nA single integer `n`.';

const intProblem = (slug, title, task, solve, range, returnType = 'int') => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType,
    params: 'int n',
    description: task + '\n\n' + IO_ONE_INT + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const cap = caseIdx < 3 ? Math.min(range[1], range[0] + 30) : range[1];
        return randInt(rng, range[0], cap) + '\n';
    },
    solve: (input) => String(solve(reader(input).int())),
});

const maths = [
    intProblem(
        'count-primes-upto', 'Count Primes up to N',
        'Print how many prime numbers are less than or equal to n.',
        (n) => {
            if (n < 2) return 0;
            const sieve = new Uint8Array(n + 1);
            let c = 0;
            for (let i = 2; i <= n; i++) {
                if (!sieve[i]) {
                    c++;
                    for (let j = i * i; j <= n; j += i) sieve[j] = 1;
                }
            }
            return c;
        },
        [1, 200000],
    ),
    intProblem(
        'prime-factorisation', 'Prime Factorisation',
        'Print the prime factors of n in non-decreasing order, separated by single spaces. Repeated factors are printed as many times as they divide n.',
        (n) => {
            const out = [];
            let x = n;
            for (let p = 2; p * p <= x; p++) {
                while (x % p === 0) { out.push(p); x /= p; }
            }
            if (x > 1) out.push(x);
            return out.join(' ');
        },
        [2, 1000000],
        'vector<int>',
    ),
    intProblem(
        'nth-prime', 'Nth Prime Number',
        'Print the n-th prime number, where the 1st prime is 2.',
        (n) => {
            const isP = (x) => {
                if (x < 2) return false;
                for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
                return true;
            };
            let c = 0;
            let v = 1;
            while (c < n) { v++; if (isP(v)) c++; }
            return v;
        },
        [1, 2000],
    ),
    intProblem(
        'euler-phi', 'Euler Totient',
        'Print how many integers in the range [1, n] are coprime with n.',
        (n) => {
            let result = n;
            let x = n;
            for (let p = 2; p * p <= x; p++) {
                if (x % p === 0) {
                    while (x % p === 0) x /= p;
                    result -= result / p;
                }
            }
            if (x > 1) result -= result / x;
            return Math.round(result);
        },
        [1, 1000000],
    ),
    intProblem(
        'digital-root', 'Digital Root',
        'Repeatedly replace n with the sum of its digits until a single digit remains. Print that digit.',
        (n) => 1 + ((n - 1) % 9),
        [1, 1000000000],
    ),
    intProblem(
        'sum-of-squares-mod', 'Sum of Squares',
        'Print the sum of the squares of the integers from 1 to n, modulo 1000000007.',
        (n) => {
            const M = 1000000007n;
            const b = BigInt(n);
            return (((b * (b + 1n) * (2n * b + 1n)) / 6n) % M).toString();
        },
        [1, 1000000],
        'long long',
    ),
    intProblem(
        'count-trailing-zeros-binary', 'Trailing Zeros in Binary',
        'Print the number of trailing zero bits in the binary representation of n.',
        (n) => {
            let c = 0;
            let x = n;
            while (x > 0 && x % 2 === 0) { c++; x /= 2; }
            return c;
        },
        [1, 1000000000],
    ),
    {
        slug: 'base-conversion',
        title: 'Base Conversion',
        difficulty: 'Medium',
        returnType: 'string',
        params: 'int n, int b',
        description: 'Convert n into base b and print the result. Digits above 9 are written as lowercase letters starting at a.\n\n**Input**\nA single line with two integers `n` and `b`, where `2 <= b <= 36`.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 1, 50) : randInt(rng, 1, 1000000);
            return n + ' ' + randInt(rng, 2, 36) + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const b = r.int();
            return n.toString(b);
        },
    },
    {
        slug: 'modular-inverse',
        title: 'Modular Inverse',
        difficulty: 'Medium',
        returnType: 'long long',
        params: 'int a, int m',
        description: 'Print the modular inverse of a modulo the prime m, i.e. the value x in [0, m) with a*x congruent to 1 mod m. Print -1 if it does not exist.\n\n**Input**\nA single line with two integers `a` and `m`, where `m` is prime.' + ONE_LINE,
        genInput: (rng) => {
            const primes = [7, 11, 13, 101, 997, 10007, 1000003, 1000000007];
            const m = primes[Math.floor(rng() * primes.length)];
            return randInt(rng, 1, m - 1) + ' ' + m + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const a = BigInt(r.int());
            const m = BigInt(r.int());
            if (a % m === 0n) return '-1';
            let e = m - 2n;
            let base = a % m;
            let res = 1n;
            while (e > 0n) {
                if (e & 1n) res = (res * base) % m;
                base = (base * base) % m;
                e >>= 1n;
            }
            return res.toString();
        },
    },
];

/* ── Matrices ──────────────────────────────────────────────────────────── */

const matrixProblem = (slug, title, task, solve, opts = {}) => ({
    slug,
    title,
    difficulty: 'Medium',
    returnType: opts.returnType || 'int',
    params: 'int n, int m, vector<vector<int>> grid',
    description: task + '\n\n**Input**\nThe first line contains two integers `n` and `m` — the number of rows and columns.\nThe next `n` lines each contain `m` space-separated integers.' + ONE_LINE,
    genInput: (rng, caseIdx) => {
        const square = opts.square;
        const n = caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 3, 8);
        const m = square ? n : (caseIdx < 3 ? randInt(rng, 1, 3) : randInt(rng, 3, 8));
        const rows = [];
        for (let i = 0; i < n; i++) rows.push(randArray(rng, m, opts.lo === undefined ? 1 : opts.lo, opts.hi || 50).join(' '));
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

const matrices = [
    matrixProblem(
        'matrix-transpose', 'Transpose a Matrix',
        'Print the transpose of the grid: m lines of n space-separated integers.',
        (g, n, m) => {
            const out = [];
            for (let j = 0; j < m; j++) {
                const row = [];
                for (let i = 0; i < n; i++) row.push(g[i][j]);
                out.push(row.join(' '));
            }
            return out.join('\n');
        },
        { returnType: 'vector<vector<int>>' },
    ),
    matrixProblem(
        'matrix-diagonal-sum', 'Sum of the Diagonals',
        'The grid is square. Print the sum of both diagonals, counting the centre element once if n is odd.',
        (g, n) => {
            let s = 0;
            for (let i = 0; i < n; i++) s += g[i][i] + g[i][n - 1 - i];
            if (n % 2 === 1) s -= g[(n - 1) / 2][(n - 1) / 2];
            return s;
        },
        { square: true },
    ),
    matrixProblem(
        'matrix-max-row-sum', 'Row with the Largest Sum',
        'Print the 0-based index of the row with the largest sum. If several tie, print the smallest index.',
        (g) => {
            let best = -Infinity;
            let idx = 0;
            g.forEach((row, i) => {
                const s = row.reduce((a, b) => a + b, 0);
                if (s > best) { best = s; idx = i; }
            });
            return idx;
        },
    ),
    matrixProblem(
        'matrix-spiral', 'Spiral Order',
        'Print the elements of the grid in clockwise spiral order starting at the top-left, separated by single spaces.',
        (g, n, m) => {
            const out = [];
            let top = 0;
            let bottom = n - 1;
            let left = 0;
            let right = m - 1;
            while (top <= bottom && left <= right) {
                for (let j = left; j <= right; j++) out.push(g[top][j]);
                top++;
                for (let i = top; i <= bottom; i++) out.push(g[i][right]);
                right--;
                if (top <= bottom) {
                    for (let j = right; j >= left; j--) out.push(g[bottom][j]);
                    bottom--;
                }
                if (left <= right) {
                    for (let i = bottom; i >= top; i--) out.push(g[i][left]);
                    left++;
                }
            }
            return out.join(' ');
        },
        { returnType: 'vector<int>' },
    ),
    matrixProblem(
        'matrix-rotate-90', 'Rotate a Matrix',
        'The grid is square. Print it rotated 90 degrees clockwise, as n lines of n space-separated integers.',
        (g, n) => {
            const out = [];
            for (let j = 0; j < n; j++) {
                const row = [];
                for (let i = n - 1; i >= 0; i--) row.push(g[i][j]);
                out.push(row.join(' '));
            }
            return out.join('\n');
        },
        { square: true, returnType: 'vector<vector<int>>' },
    ),
    matrixProblem(
        'matrix-count-negatives', 'Count Negative Entries',
        'Count the entries of the grid that are strictly negative.',
        (g) => g.reduce((s, row) => s + row.filter((x) => x < 0).length, 0),
        { lo: -20, hi: 20 },
    ),
];

/* ── Dynamic programming and graphs ────────────────────────────────────── */

const dp = [
    {
        slug: 'climbing-stairs',
        title: 'Climbing Stairs',
        difficulty: 'Medium',
        returnType: 'long long',
        params: 'int n',
        description: 'You climb a staircase of n steps, taking either 1 or 2 steps at a time. Print the number of distinct ways to reach the top, modulo 1000000007.\n\n' + IO_ONE_INT + ONE_LINE,
        genInput: (rng, caseIdx) => (caseIdx < 3 ? randInt(rng, 1, 12) : randInt(rng, 1, 10000)) + '\n',
        solve: (input) => {
            const n = reader(input).int();
            const M = 1000000007n;
            let a = 1n;
            let b = 1n;
            for (let i = 2; i <= n; i++) {
                const c = (a + b) % M;
                a = b;
                b = c;
            }
            return b.toString();
        },
    },
    arrayProblem(
        'house-robber', 'Maximum Non-Adjacent Sum',
        'Choose a subset of elements with no two adjacent so the sum is as large as possible. Print that sum. The empty subset is allowed, so the answer is never negative.',
        (a) => {
            let incl = 0;
            let excl = 0;
            for (const x of a) {
                const newIncl = excl + x;
                excl = Math.max(excl, incl);
                incl = newIncl;
            }
            return Math.max(incl, excl, 0);
        },
        { lo: -20, hi: 60, returnType: 'long long' },
    ),
    arrayProblem(
        'lis-length', 'Longest Increasing Subsequence',
        'Print the length of the longest strictly increasing subsequence of the array.',
        (a) => {
            const tails = [];
            for (const x of a) {
                let lo = 0;
                let hi = tails.length;
                while (lo < hi) {
                    const mid = (lo + hi) >> 1;
                    if (tails[mid] < x) lo = mid + 1; else hi = mid;
                }
                tails[lo] = x;
            }
            return tails.length;
        },
        { maxN: 60 },
    ),
    arrayKProblem(
        'coin-change-min', 'Minimum Coins',
        'The array lists available coin denominations, each usable any number of times. Print the fewest coins that sum to exactly k, or -1 if it cannot be done.',
        (coins, k) => {
            const INF = Infinity;
            const d = new Array(k + 1).fill(INF);
            d[0] = 0;
            for (let v = 1; v <= k; v++) {
                for (const c of coins) {
                    if (c <= v && d[v - c] + 1 < d[v]) d[v] = d[v - c] + 1;
                }
            }
            return d[k] === INF ? -1 : d[k];
        },
        { genK: (rng) => randInt(rng, 1, 200), lo: 1, hi: 25, maxN: 10 },
    ),
    arrayKProblem(
        'subset-sum-exists', 'Subset Sum',
        'Print 1 if some subset of the array sums to exactly k, 0 otherwise.',
        (a, k) => {
            const reach = new Set([0]);
            for (const x of a) {
                for (const v of Array.from(reach)) {
                    if (v + x <= k) reach.add(v + x);
                }
            }
            return reach.has(k) ? 1 : 0;
        },
        { genK: (rng) => randInt(rng, 1, 150), lo: 1, hi: 40, maxN: 20 },
    ),
    {
        slug: 'count-components',
        title: 'Connected Components',
        difficulty: 'Medium',
        returnType: 'int',
        params: 'int n, int m, vector<vector<int>> edges',
        description: 'An undirected graph has n vertices numbered 1..n and m edges. Print the number of connected components.\n\n**Input**\nThe first line contains two integers `n` and `m`.\nEach of the next `m` lines contains two integers `u` and `v` — an edge between those vertices.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 5, 40);
            const m = caseIdx < 3 ? randInt(rng, 1, 4) : randInt(rng, 3, Math.min(60, n * 2));
            const lines = [];
            for (let i = 0; i < m; i++) lines.push(randInt(rng, 1, n) + ' ' + randInt(rng, 1, n));
            return n + ' ' + m + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const m = r.int();
            const parent = Array.from({ length: n + 1 }, (_, i) => i);
            const find = (x) => {
                while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                return x;
            };
            for (let i = 0; i < m; i++) {
                const a = find(r.int());
                const b = find(r.int());
                if (a !== b) parent[a] = b;
            }
            const roots = new Set();
            for (let v = 1; v <= n; v++) roots.add(find(v));
            return String(roots.size);
        },
    },
    {
        slug: 'bfs-shortest-path',
        title: 'Shortest Path in an Unweighted Graph',
        difficulty: 'Medium',
        returnType: 'int',
        params: 'int n, int m, vector<vector<int>> edges',
        description: 'An undirected graph has n vertices numbered 1..n and m edges. Print the number of edges on a shortest path from vertex 1 to vertex n, or -1 if none exists.\n\n**Input**\nThe first line contains two integers `n` and `m`.\nEach of the next `m` lines contains two integers `u` and `v`.' + ONE_LINE,
        genInput: (rng, caseIdx) => {
            const n = caseIdx < 3 ? randInt(rng, 2, 5) : randInt(rng, 5, 30);
            const m = caseIdx < 3 ? randInt(rng, 1, 5) : randInt(rng, 4, Math.min(60, n * 2));
            const lines = [];
            for (let i = 0; i < m; i++) lines.push(randInt(rng, 1, n) + ' ' + randInt(rng, 1, n));
            return n + ' ' + m + '\n' + lines.join('\n') + '\n';
        },
        solve: (input) => {
            const r = reader(input);
            const n = r.int();
            const m = r.int();
            const adj = Array.from({ length: n + 1 }, () => []);
            for (let i = 0; i < m; i++) {
                const u = r.int();
                const v = r.int();
                adj[u].push(v);
                adj[v].push(u);
            }
            const dist = new Array(n + 1).fill(-1);
            dist[1] = 0;
            const q = [1];
            for (let h = 0; h < q.length; h++) {
                const u = q[h];
                for (const v of adj[u]) {
                    if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); }
                }
            }
            return String(dist[n]);
        },
    },
];

module.exports = [].concat(arrays, strings, maths, matrices, dp);
