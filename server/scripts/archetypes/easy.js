/* ───────────────────────────────────────────────────────────────────────────
   Easy (difficulty "Low") problem families.

   A family shares an input format; each variant inside it is a genuinely
   different question with its own title, statement and reference solution.
   ─────────────────────────────────────────────────────────────────────────── */

const { randInt, randArray, randWord, reader, LOWER } = require('../lib/util');
/* Constraints mirror the generator's own bounds, so they cannot drift from
   the data that is actually produced. */
const rangeLine = (name, lo, hi) => '- `' + lo + ' <= ' + name + ' <= ' + hi + '`';
const sizeLine  = (name, maxN, minN) => rangeLine(name, minN === undefined ? 1 : minN, maxN);


/* ── Family: single integer array ───────────────────────────────────────── */

const ARRAY_IO = [
    '**Input**',
    'The first line contains an integer `n` — the number of elements.',
    'The second line contains `n` space-separated integers.',
    '',
    '**Output**',
    'Print a single integer on one line.',
].join('\n');

const arrayVariants = [
    {
        slug: 'array-sum',
        title: 'Sum of Array Elements',
        task: 'Compute the sum of all elements of the array.',
        solve: (a) => a.reduce((s, x) => s + x, 0),
    },
    {
        slug: 'array-max',
        title: 'Largest Element in an Array',
        task: 'Find the largest element of the array.',
        solve: (a) => Math.max.apply(null, a),
    },
    {
        slug: 'array-min',
        title: 'Smallest Element in an Array',
        task: 'Find the smallest element of the array.',
        solve: (a) => Math.min.apply(null, a),
    },
    {
        slug: 'array-count-even',
        title: 'Count Even Numbers',
        task: 'Count how many elements of the array are even.',
        solve: (a) => a.filter((x) => x % 2 === 0).length,
    },
    {
        slug: 'array-count-odd',
        title: 'Count Odd Numbers',
        task: 'Count how many elements of the array are odd.',
        solve: (a) => a.filter((x) => Math.abs(x % 2) === 1).length,
    },
    {
        slug: 'array-sum-even-values',
        title: 'Sum of Even Values',
        task: 'Compute the sum of the elements that are even. Print 0 if there are none.',
        solve: (a) => a.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0),
    },
    {
        slug: 'array-sum-alternate',
        title: 'Alternating Sum',
        task: 'Compute a[0] - a[1] + a[2] - a[3] + ... over the whole array.',
        solve: (a) => a.reduce((s, x, i) => s + (i % 2 === 0 ? x : -x), 0),
    },
    {
        slug: 'array-second-largest',
        title: 'Second Largest Element',
        task: 'Find the second largest distinct value in the array. If it does not exist, print -1.',
        solve: (a) => {
            const u = Array.from(new Set(a)).sort((x, y) => y - x);
            return u.length < 2 ? -1 : u[1];
        },
    },
    {
        slug: 'array-range',
        title: 'Range of an Array',
        task: 'Print the difference between the largest and the smallest element.',
        solve: (a) => Math.max.apply(null, a) - Math.min.apply(null, a),
    },
    {
        slug: 'array-count-distinct',
        title: 'Count Distinct Elements',
        task: 'Count how many distinct values the array contains.',
        solve: (a) => new Set(a).size,
    },
    {
        slug: 'array-max-abs',
        title: 'Largest Absolute Value',
        task: 'Print the largest absolute value among the elements.',
        solve: (a) => Math.max.apply(null, a.map(Math.abs)),
    },
    {
        slug: 'array-count-positive',
        title: 'Count Positive Numbers',
        task: 'Count the elements that are strictly greater than zero.',
        solve: (a) => a.filter((x) => x > 0).length,
    },
    {
        slug: 'array-product-sign',
        title: 'Sign of the Product',
        task: 'Without computing the product, print 1 if the product of all elements is positive, -1 if it is negative, and 0 if it is zero.',
        solve: (a) => {
            if (a.some((x) => x === 0)) return 0;
            return a.filter((x) => x < 0).length % 2 === 0 ? 1 : -1;
        },
    },
    {
        slug: 'array-prefix-max-count',
        title: 'Count Prefix Maximums',
        task: 'Count the elements that are strictly greater than every element before them. The first element always counts.',
        solve: (a) => {
            let best = -Infinity;
            let c = 0;
            for (const x of a) {
                if (x > best) { c++; best = x; }
            }
            return c;
        },
    },
    {
        slug: 'array-equal-neighbours',
        title: 'Count Equal Adjacent Pairs',
        task: 'Count the index pairs (i, i+1) where a[i] equals a[i+1].',
        solve: (a) => {
            let c = 0;
            for (let i = 0; i + 1 < a.length; i++) {
                if (a[i] === a[i + 1]) c++;
            }
            return c;
        },
    },
];

const arrayFamily = arrayVariants.map((v) => ({
    slug: v.slug,
    title: v.title,
    difficulty: 'Low',
    returnType: 'int',
    params: 'int n, vector<int> arr',
    description: v.task + '\n\n' + ARRAY_IO,
    constraints: [sizeLine('n', 40), rangeLine('arr[i]', -50, 100)],
    genInput: (rng, caseIdx) => {
        // Early cases stay small so the samples read clearly; later ones grow.
        const n = caseIdx < 3 ? randInt(rng, 1, 5) : randInt(rng, 5, 40);
        const lo = caseIdx % 3 === 0 ? -50 : 1;
        const arr = randArray(rng, n, lo, 100);
        return n + '\n' + arr.join(' ') + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        const n = r.int();
        return String(v.solve(r.ints(n)));
    },
}));

/* ── Family: single integer ─────────────────────────────────────────────── */

const INT_IO = [
    '**Input**',
    'A single integer `n`.',
    '',
    '**Output**',
    'Print a single integer on one line.',
].join('\n');

const intVariants = [
    {
        slug: 'digit-sum',
        title: 'Sum of Digits',
        task: 'Print the sum of the decimal digits of n.',
        range: [1, 1000000],
        solve: (n) => String(n).split('').reduce((s, d) => s + Number(d), 0),
    },
    {
        slug: 'digit-count',
        title: 'Count the Digits',
        task: 'Print how many decimal digits n has.',
        range: [1, 1000000000],
        solve: (n) => String(n).length,
    },
    {
        slug: 'reverse-number',
        title: 'Reverse a Number',
        task: 'Print the digits of n in reverse order, with any leading zeros dropped.',
        range: [1, 1000000],
        solve: (n) => parseInt(String(n).split('').reverse().join(''), 10),
    },
    {
        slug: 'is-prime',
        title: 'Primality Test',
        task: 'Print 1 if n is prime and 0 otherwise.',
        range: [1, 100000],
        solve: (n) => {
            if (n < 2) return 0;
            for (let i = 2; i * i <= n; i++) {
                if (n % i === 0) return 0;
            }
            return 1;
        },
    },
    {
        slug: 'count-divisors',
        title: 'Count the Divisors',
        task: 'Print how many positive integers divide n exactly.',
        range: [1, 100000],
        solve: (n) => {
            let c = 0;
            for (let i = 1; i * i <= n; i++) {
                if (n % i === 0) c += (i === n / i ? 1 : 2);
            }
            return c;
        },
    },
    {
        slug: 'sum-divisors',
        title: 'Sum of Proper Divisors',
        task: 'Print the sum of the divisors of n, excluding n itself.',
        range: [1, 100000],
        solve: (n) => {
            let s = 0;
            for (let i = 1; i * i <= n; i++) {
                if (n % i === 0) {
                    if (i !== n) s += i;
                    const j = n / i;
                    if (j !== i && j !== n) s += j;
                }
            }
            return s;
        },
    },
    {
        slug: 'is-perfect',
        title: 'Perfect Number',
        task: 'A perfect number equals the sum of its proper divisors. Print 1 if n is perfect, 0 otherwise.',
        range: [1, 10000],
        solve: (n) => {
            let s = 0;
            for (let i = 1; i * i <= n; i++) {
                if (n % i === 0) {
                    if (i !== n) s += i;
                    const j = n / i;
                    if (j !== i && j !== n) s += j;
                }
            }
            return s === n && n > 1 ? 1 : 0;
        },
    },
    {
        slug: 'is-armstrong',
        title: 'Armstrong Number',
        task: 'An Armstrong number equals the sum of its digits each raised to the power of the digit count. Print 1 if n is an Armstrong number, 0 otherwise.',
        range: [1, 100000],
        solve: (n) => {
            const d = String(n).split('');
            const total = d.reduce((s, x) => s + Math.pow(Number(x), d.length), 0);
            return total === n ? 1 : 0;
        },
    },
    {
        slug: 'is-palindrome-number',
        title: 'Palindromic Number',
        task: 'Print 1 if the decimal representation of n reads the same forwards and backwards, 0 otherwise.',
        range: [1, 1000000],
        solve: (n) => {
            const s = String(n);
            return s === s.split('').reverse().join('') ? 1 : 0;
        },
    },
    {
        slug: 'factorial-mod',
        title: 'Factorial Modulo 1000000007',
        task: 'Print n! modulo 1000000007.',
        range: [1, 2000],
        solve: (n) => {
            const M = 1000000007n;
            let f = 1n;
            for (let i = 2n; i <= BigInt(n); i++) f = (f * i) % M;
            return f.toString();
        },
    },
    {
        slug: 'nth-fibonacci',
        title: 'Nth Fibonacci Number',
        task: 'With F(0) = 0 and F(1) = 1, print F(n) modulo 1000000007.',
        range: [0, 10000],
        solve: (n) => {
            const M = 1000000007n;
            let a = 0n;
            let b = 1n;
            for (let i = 0; i < n; i++) {
                const next = (a + b) % M;
                a = b;
                b = next;
            }
            return a.toString();
        },
    },
    {
        slug: 'count-set-bits',
        title: 'Count Set Bits',
        task: 'Print the number of 1 bits in the binary representation of n.',
        range: [0, 1000000000],
        solve: (n) => n.toString(2).split('').filter((c) => c === '1').length,
    },
    {
        slug: 'is-power-of-two',
        title: 'Power of Two',
        task: 'Print 1 if n is a power of two, 0 otherwise.',
        range: [1, 1000000],
        solve: (n) => (n > 0 && (n & (n - 1)) === 0 ? 1 : 0),
    },
    {
        slug: 'trailing-zeros-factorial',
        title: 'Trailing Zeros in Factorial',
        task: 'Print the number of trailing zeros in n!.',
        range: [1, 1000000],
        solve: (n) => {
            let c = 0;
            for (let p = 5; p <= n; p *= 5) c += Math.floor(n / p);
            return c;
        },
    },
    {
        slug: 'collatz-steps',
        title: 'Collatz Steps',
        task: 'Repeatedly halve n if it is even, otherwise replace it with 3n + 1. Print how many steps it takes to reach 1.',
        range: [1, 100000],
        solve: (n) => {
            let c = 0;
            let x = BigInt(n);
            while (x !== 1n) {
                x = x % 2n === 0n ? x / 2n : 3n * x + 1n;
                c++;
            }
            return c;
        },
    },
];

const BIG_INT_SLUGS = new Set(['factorial-mod', 'nth-fibonacci']);

const intFamily = intVariants.map((v) => ({
    slug: v.slug,
    title: v.title,
    difficulty: 'Low',
    returnType: BIG_INT_SLUGS.has(v.slug) ? 'long long' : 'int',
    params: 'int n',
    description: v.task + '\n\n' + INT_IO,
    constraints: [rangeLine('n', v.range[0], v.range[1])],
    genInput: (rng, caseIdx) => {
        const lo = v.range[0];
        const hi = v.range[1];
        // Early cases hug the lower bound so the worked examples stay small.
        const cap = caseIdx < 3 ? Math.min(hi, Math.max(lo + 9, Math.floor(hi / 1000) || lo + 9)) : hi;
        return randInt(rng, lo, cap) + '\n';
    },
    solve: (input) => String(v.solve(reader(input).int())),
}));

/* ── Family: single lowercase string ───────────────────────────────────── */

const STR_IO = [
    '**Input**',
    'A single line containing a string `s` of lowercase letters.',
    '',
    '**Output**',
    'Print the answer on one line.',
].join('\n');

const strVariants = [
    {
        slug: 'count-vowels',
        title: 'Count the Vowels',
        task: 'Count the vowels (a, e, i, o, u) in s.',
        ret: 'int',
        solve: (s) => s.split('').filter((c) => 'aeiou'.indexOf(c) !== -1).length,
    },
    {
        slug: 'count-consonants',
        title: 'Count the Consonants',
        task: 'Count the letters of s that are not vowels.',
        ret: 'int',
        solve: (s) => s.split('').filter((c) => 'aeiou'.indexOf(c) === -1).length,
    },
    {
        slug: 'reverse-string',
        title: 'Reverse a String',
        task: 'Print s reversed.',
        ret: 'string',
        solve: (s) => s.split('').reverse().join(''),
    },
    {
        slug: 'is-palindrome-string',
        title: 'Palindromic String',
        task: 'Print 1 if s reads the same forwards and backwards, 0 otherwise.',
        ret: 'int',
        solve: (s) => (s === s.split('').reverse().join('') ? 1 : 0),
    },
    {
        slug: 'most-frequent-char',
        title: 'Most Frequent Character',
        task: 'Print the character that occurs most often in s. If several tie, print the alphabetically smallest.',
        ret: 'string',
        solve: (s) => {
            const f = {};
            for (const c of s) f[c] = (f[c] || 0) + 1;
            return Object.keys(f).sort((a, b) => f[b] - f[a] || (a < b ? -1 : 1))[0];
        },
    },
    {
        slug: 'count-distinct-chars',
        title: 'Count Distinct Characters',
        task: 'Count how many distinct characters appear in s.',
        ret: 'int',
        solve: (s) => new Set(s).size,
    },
    {
        slug: 'remove-duplicates-string',
        title: 'Remove Duplicate Characters',
        task: 'Print s with every character after its first occurrence removed, preserving order.',
        ret: 'string',
        solve: (s) => {
            const seen = new Set();
            let out = '';
            for (const c of s) {
                if (!seen.has(c)) { seen.add(c); out += c; }
            }
            return out;
        },
    },
    {
        slug: 'sort-string',
        title: 'Sort the Characters',
        task: 'Print the characters of s in non-decreasing alphabetical order.',
        ret: 'string',
        solve: (s) => s.split('').sort().join(''),
    },
    {
        slug: 'longest-run',
        title: 'Longest Run of One Character',
        task: 'Print the length of the longest block of consecutive identical characters in s.',
        ret: 'int',
        solve: (s) => {
            let best = 0;
            let run = 0;
            for (let i = 0; i < s.length; i++) {
                run = i && s[i] === s[i - 1] ? run + 1 : 1;
                if (run > best) best = run;
            }
            return best;
        },
    },
    {
        slug: 'run-length-encode',
        title: 'Run-Length Encoding',
        task: 'Encode s by replacing each block of consecutive identical characters with the character followed by the block length. For example aaabb becomes a3b2.',
        ret: 'string',
        solve: (s) => {
            let out = '';
            let i = 0;
            while (i < s.length) {
                let j = i;
                while (j < s.length && s[j] === s[i]) j++;
                out += s[i] + (j - i);
                i = j;
            }
            return out;
        },
    },
    {
        slug: 'first-unique-char',
        title: 'First Non-Repeating Character',
        task: 'Print the first character of s that occurs exactly once. If there is none, print -1.',
        ret: 'string',
        solve: (s) => {
            const f = {};
            for (const c of s) f[c] = (f[c] || 0) + 1;
            for (const c of s) {
                if (f[c] === 1) return c;
            }
            return -1;
        },
    },
    {
        slug: 'alphabet-coverage',
        title: 'Alphabet Coverage',
        task: 'Print how many of the 26 lowercase letters do not appear in s.',
        ret: 'int',
        solve: (s) => 26 - new Set(s).size,
    },
];

const strFamily = strVariants.map((v) => ({
    slug: v.slug,
    title: v.title,
    difficulty: 'Low',
    returnType: v.ret,
    params: 'string s',
    description: v.task + '\n\n' + STR_IO,
    constraints: [sizeLine('s.length', 40), '- `s` consists of lowercase English letters only'],
    genInput: (rng, caseIdx) => {
        const n = caseIdx < 3 ? randInt(rng, 1, 6) : randInt(rng, 6, 40);
        // A narrow alphabet makes repeats — and so runs — likely.
        const alpha = caseIdx % 3 === 0 ? 'ab' : caseIdx % 3 === 1 ? 'abcde' : LOWER;
        return randWord(rng, n, alpha) + '\n';
    },
    solve: (input) => String(v.solve(reader(input).word())),
}));

/* ── Family: two integers ──────────────────────────────────────────────── */

const PAIR_IO = [
    '**Input**',
    'A single line with two space-separated integers `a` and `b`.',
    '',
    '**Output**',
    'Print a single integer on one line.',
].join('\n');

const modPow = (base, exp, mod) => {
    let b = BigInt(base) % mod;
    let e = BigInt(exp);
    let r = 1n;
    while (e > 0n) {
        if (e & 1n) r = (r * b) % mod;
        b = (b * b) % mod;
        e >>= 1n;
    }
    return r;
};

const pairVariants = [
    {
        slug: 'gcd-two',
        title: 'Greatest Common Divisor',
        task: 'Print the greatest common divisor of a and b.',
        solve: (a, b) => {
            let x = a;
            let y = b;
            while (y) {
                const t = x % y;
                x = y;
                y = t;
            }
            return x;
        },
    },
    {
        slug: 'lcm-two',
        title: 'Least Common Multiple',
        task: 'Print the least common multiple of a and b.',
        solve: (a, b) => {
            const gcd = (x, y) => (y ? gcd(y, x % y) : x);
            return (a / gcd(a, b)) * b;
        },
    },
    {
        slug: 'power-mod',
        title: 'Modular Exponentiation',
        task: 'Print a raised to the power b, modulo 1000000007.',
        solve: (a, b) => modPow(a, b, 1000000007n).toString(),
    },
    {
        slug: 'count-multiples',
        title: 'Count Multiples in a Range',
        task: 'Print how many integers in the inclusive range [1, a] are divisible by b.',
        solve: (a, b) => Math.floor(a / b),
    },
    {
        slug: 'sum-range',
        title: 'Sum of a Range',
        task: 'Print the sum of all integers from a to b inclusive. You may assume a is at most b.',
        solve: (a, b) => ((b - a + 1) * (a + b)) / 2,
    },
    {
        slug: 'binomial-small',
        title: 'Binomial Coefficient',
        task: 'Print "a choose b" modulo 1000000007. You may assume b is at most a.',
        solve: (a, b) => {
            const M = 1000000007n;
            let num = 1n;
            let den = 1n;
            for (let i = 0n; i < BigInt(b); i++) {
                num = (num * (BigInt(a) - i)) % M;
                den = (den * (i + 1n)) % M;
            }
            const inv = modPow(den, M - 2n, M);
            return ((num * inv) % M).toString();
        },
    },
];

const PAIR_BIG_SLUGS = new Set(['power-mod', 'binomial-small', 'lcm-two']);

const pairFamily = pairVariants.map((v) => ({
    slug: v.slug,
    title: v.title,
    difficulty: 'Low',
    returnType: PAIR_BIG_SLUGS.has(v.slug) ? 'long long' : 'int',
    params: 'int a, int b',
    description: v.task + '\n\n' + PAIR_IO,
    constraints: [rangeLine('a, b', 1, 1000)],
    genInput: (rng, caseIdx) => {
        const hi = caseIdx < 3 ? 20 : 1000;
        let a = randInt(rng, 1, hi);
        let b = randInt(rng, 1, hi);
        if (v.slug === 'sum-range' && a > b) {
            const t = a; a = b; b = t;
        }
        if (v.slug === 'binomial-small') b = randInt(rng, 0, Math.min(a, 30));
        if (v.slug === 'power-mod') b = randInt(rng, 0, 1000);
        return a + ' ' + b + '\n';
    },
    solve: (input) => {
        const r = reader(input);
        return String(v.solve(r.int(), r.int()));
    },
}));

module.exports = [].concat(arrayFamily, intFamily, strFamily, pairFamily);
