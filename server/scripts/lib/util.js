/* ───────────────────────────────────────────────────────────────────────────
   Seed helpers.

   Every problem is stdin → stdout, matching how the judge executes code:
   `input_data` is piped to the process and stdout is compared against
   `expected_output`. Expected outputs are therefore never written by hand —
   they are produced by the reference solution in each archetype, so the
   seeded test data is correct by construction.
   ─────────────────────────────────────────────────────────────────────────── */

/* Deterministic PRNG (mulberry32) so a reseed reproduces identical data. */
function rngFor(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

const randArray = (rng, n, lo, hi) =>
    Array.from({ length: n }, () => randInt(rng, lo, hi));

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

const LOWER = 'abcdefghijklmnopqrstuvwxyz';

const randWord = (rng, n, alphabet = LOWER) =>
    Array.from({ length: n }, () => alphabet[Math.floor(rng() * alphabet.length)]).join('');

/* Tokenises stdin into whitespace-separated fields. */
function reader(input) {
    const tokens = String(input).split(/\s+/).filter(Boolean);
    let i = 0;
    return {
        int:   () => parseInt(tokens[i++], 10),
        num:   () => parseFloat(tokens[i++]),
        word:  () => tokens[i++],
        ints:  (n) => Array.from({ length: n }, () => parseInt(tokens[i++], 10)),
        words: (n) => Array.from({ length: n }, () => tokens[i++]),
        rest:  () => tokens.slice(i),
    };
}

/* Fixed-precision output, used by the float-tolerant problems. */
const fixed = (x, d = 4) => Number(x).toFixed(d);

module.exports = { rngFor, randInt, randArray, pick, randWord, reader, fixed, LOWER };
