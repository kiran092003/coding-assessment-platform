/* ───────────────────────────────────────────────────────────────────────────
   Expected time and space complexity per problem, as [time, space].

   These describe the intended optimal solution, not necessarily the shortest
   one — `n` is the primary input size (array length, string length, or the
   value of n for the numeric problems), `V`/`E` are vertices and edges, and
   `k`/`W` are the named parameters of the problem.

   Space excludes the input itself and the output buffer, following the usual
   convention.
   ─────────────────────────────────────────────────────────────────────────── */

const COMPLEXITY = {
    // ── easy: single array ──────────────────────────────────────────────
    'array-sum':                  ['O(n)', 'O(1)'],
    'array-max':                  ['O(n)', 'O(1)'],
    'array-min':                  ['O(n)', 'O(1)'],
    'array-count-even':           ['O(n)', 'O(1)'],
    'array-count-odd':            ['O(n)', 'O(1)'],
    'array-sum-even-values':      ['O(n)', 'O(1)'],
    'array-sum-alternate':        ['O(n)', 'O(1)'],
    'array-second-largest':       ['O(n)', 'O(1)'],
    'array-range':                ['O(n)', 'O(1)'],
    'array-count-distinct':       ['O(n)', 'O(n)'],
    'array-max-abs':              ['O(n)', 'O(1)'],
    'array-count-positive':       ['O(n)', 'O(1)'],
    'array-product-sign':         ['O(n)', 'O(1)'],
    'array-prefix-max-count':     ['O(n)', 'O(1)'],
    'array-equal-neighbours':     ['O(n)', 'O(1)'],

    // ── easy: single integer ────────────────────────────────────────────
    'digit-sum':                  ['O(log n)', 'O(1)'],
    'digit-count':                ['O(log n)', 'O(1)'],
    'reverse-number':             ['O(log n)', 'O(1)'],
    'is-prime':                   ['O(sqrt n)', 'O(1)'],
    'count-divisors':             ['O(sqrt n)', 'O(1)'],
    'sum-divisors':               ['O(sqrt n)', 'O(1)'],
    'is-perfect':                 ['O(sqrt n)', 'O(1)'],
    'is-armstrong':               ['O(log n)', 'O(1)'],
    'is-palindrome-number':       ['O(log n)', 'O(1)'],
    'factorial-mod':              ['O(n)', 'O(1)'],
    'nth-fibonacci':              ['O(n)', 'O(1)'],
    'count-set-bits':             ['O(log n)', 'O(1)'],
    'is-power-of-two':            ['O(1)', 'O(1)'],
    'trailing-zeros-factorial':   ['O(log n)', 'O(1)'],
    'collatz-steps':              ['O(log n) amortised', 'O(1)'],

    // ── easy: strings ───────────────────────────────────────────────────
    'count-vowels':               ['O(n)', 'O(1)'],
    'count-consonants':           ['O(n)', 'O(1)'],
    'reverse-string':             ['O(n)', 'O(n)'],
    'is-palindrome-string':       ['O(n)', 'O(1)'],
    'most-frequent-char':         ['O(n)', 'O(1)'],
    'count-distinct-chars':       ['O(n)', 'O(1)'],
    'remove-duplicates-string':   ['O(n)', 'O(n)'],
    'sort-string':                ['O(n log n)', 'O(n)'],
    'longest-run':                ['O(n)', 'O(1)'],
    'run-length-encode':          ['O(n)', 'O(n)'],
    'first-unique-char':          ['O(n)', 'O(1)'],
    'alphabet-coverage':          ['O(n)', 'O(1)'],

    // ── easy: integer pairs ─────────────────────────────────────────────
    'gcd-two':                    ['O(log min(a, b))', 'O(1)'],
    'lcm-two':                    ['O(log min(a, b))', 'O(1)'],
    'power-mod':                  ['O(log b)', 'O(1)'],
    'count-multiples':            ['O(1)', 'O(1)'],
    'sum-range':                  ['O(1)', 'O(1)'],
    'binomial-small':             ['O(b + log m)', 'O(1)'],

    // ── easy-extra: two arrays ──────────────────────────────────────────
    'dot-product':                ['O(n)', 'O(1)'],
    'elementwise-sum':            ['O(n)', 'O(n)'],
    'elementwise-max':            ['O(n)', 'O(n)'],
    'count-common-values':        ['O(n)', 'O(n)'],
    'union-size':                 ['O(n)', 'O(n)'],
    'is-permutation':             ['O(n log n)', 'O(n)'],
    'hamming-distance-array':     ['O(n)', 'O(1)'],
    'count-a-greater':            ['O(n)', 'O(1)'],
    'merge-sorted-arrays':        ['O(n)', 'O(n)'],
    'max-pair-sum-index':         ['O(n)', 'O(1)'],
    'first-difference-index':     ['O(n)', 'O(1)'],
    'swap-count-to-match':        ['O(n)', 'O(n)'],

    // ── easy-extra: matrices ────────────────────────────────────────────
    'matrix-total-sum':           ['O(n * m)', 'O(1)'],
    'matrix-row-sums':            ['O(n * m)', 'O(n)'],
    'matrix-column-max':          ['O(n * m)', 'O(m)'],
    'matrix-is-identity':         ['O(n^2)', 'O(1)'],
    'matrix-is-symmetric':        ['O(n^2)', 'O(1)'],
    'matrix-count-zeros':         ['O(n * m)', 'O(1)'],
    'matrix-border-sum':          ['O(n + m)', 'O(1)'],
    'matrix-main-diagonal':       ['O(n)', 'O(n)'],

    // ── easy-extra: bits ────────────────────────────────────────────────
    'array-and-all':              ['O(n)', 'O(1)'],
    'array-or-all':               ['O(n)', 'O(1)'],
    'array-xor-all':              ['O(n)', 'O(1)'],
    'find-single-odd-occurrence': ['O(n)', 'O(1)'],
    'toggle-kth-bit':             ['O(1)', 'O(1)'],
    'bit-parity':                 ['O(log n)', 'O(1)'],
    'highest-power-of-two':       ['O(log n)', 'O(1)'],
    'to-binary-string':           ['O(log n)', 'O(log n)'],

    // ── easy-extra: small-number logic ──────────────────────────────────
    'max-of-three':               ['O(1)', 'O(1)'],
    'min-of-three':               ['O(1)', 'O(1)'],
    'sort-three':                 ['O(1)', 'O(1)'],
    'triangle-valid':             ['O(1)', 'O(1)'],
    'triangle-type':              ['O(1)', 'O(1)'],
    'abs-difference':             ['O(1)', 'O(1)'],
    'ceil-division':              ['O(1)', 'O(1)'],
    'clamp-value':                ['O(1)', 'O(1)'],
    'reduce-fraction':            ['O(log min(a, b))', 'O(1)'],
    'triangular-number':          ['O(1)', 'O(1)'],
    'sum-first-n-odds':           ['O(1)', 'O(1)'],
    'is-leap-year':               ['O(1)', 'O(1)'],
    'count-fizzbuzz':             ['O(1)', 'O(1)'],
    'square-root-floor':          ['O(log n)', 'O(1)'],
    'is-fibonacci':               ['O(log n)', 'O(1)'],
    'average-two-precise':        ['O(1)', 'O(1)'],
    'average-three-precise':      ['O(1)', 'O(1)'],

    // ── easy-extra: more arrays ─────────────────────────────────────────
    'count-above-average':        ['O(n)', 'O(1)'],
    'clamp-negatives':            ['O(n)', 'O(n)'],
    'running-max':                ['O(n)', 'O(n)'],
    'count-peaks':                ['O(n)', 'O(1)'],
    'is-sorted':                  ['O(n)', 'O(1)'],
    'rotate-by-one':              ['O(n)', 'O(n)'],
    'sum-of-squares-array':       ['O(n)', 'O(1)'],
    'count-duplicates':           ['O(n)', 'O(n)'],
    'mean-rounded':               ['O(n)', 'O(1)'],
    'sum-first-k':                ['O(k)', 'O(1)'],
    'count-greater-than-k':       ['O(n)', 'O(1)'],
    'index-of-value':             ['O(n)', 'O(1)'],
    'count-occurrences-of-k':     ['O(n)', 'O(1)'],
    'closest-to-k':               ['O(n)', 'O(1)'],

    // ── easy-extra: more strings ────────────────────────────────────────
    'to-upper-case':              ['O(n)', 'O(n)'],
    'remove-vowels':              ['O(n)', 'O(n)'],
    'string-length':              ['O(1)', 'O(1)'],
    'alternate-case':             ['O(n)', 'O(n)'],
    'middle-character':           ['O(1)', 'O(1)'],
    'count-char-pairs':           ['O(n)', 'O(1)'],
    'lexicographically-smallest-char': ['O(n)', 'O(1)'],
    'concat-length':              ['O(1)', 'O(1)'],
    'starts-with':                ['O(m)', 'O(1)'],
    'ends-with':                  ['O(m)', 'O(1)'],
    'lexicographic-min':          ['O(n)', 'O(1)'],
    'longest-common-prefix-two':  ['O(min(n, m))', 'O(1)'],
    'count-given-char':           ['O(n)', 'O(1)'],
    'repeat-string':              ['O(n * k)', 'O(n * k)'],

    // ── medium: arrays and sorting ──────────────────────────────────────
    'sort-ascending':             ['O(n log n)', 'O(n)'],
    'sort-descending':            ['O(n log n)', 'O(n)'],
    'max-subarray-sum':           ['O(n)', 'O(1)'],
    'max-profit':                 ['O(n)', 'O(1)'],
    'longest-increasing-run':     ['O(n)', 'O(1)'],
    'majority-element':           ['O(n)', 'O(1)'],
    'equilibrium-index':          ['O(n)', 'O(1)'],
    'count-inversions':           ['O(n^2)', 'O(1)'],
    'smallest-missing-positive':  ['O(n)', 'O(n)'],
    'move-zeros':                 ['O(n)', 'O(n)'],
    'max-product-pair':           ['O(n)', 'O(1)'],
    'median-of-array':            ['O(n log n)', 'O(n)'],
    'min-moves-equal':            ['O(n log n)', 'O(n)'],
    'count-distinct-pairs-diff':  ['O(n)', 'O(n)'],
    'kth-smallest':               ['O(n log n)', 'O(n)'],
    'kth-largest':                ['O(n log n)', 'O(n)'],
    'count-pairs-sum-k':          ['O(n)', 'O(n)'],
    'window-max-sum':             ['O(n)', 'O(1)'],
    'rotate-array':               ['O(n)', 'O(n)'],
    'subarray-sum-count':         ['O(n)', 'O(n)'],
    'longest-window-sum-at-most': ['O(n)', 'O(1)'],
    'remove-duplicates-sorted':   ['O(n)', 'O(n)'],
    'prefix-sum-print':           ['O(n)', 'O(n)'],

    // ── medium: strings ─────────────────────────────────────────────────
    'count-palindromic-substrings':     ['O(n^2)', 'O(1)'],
    'longest-palindromic-substring-len':['O(n^2)', 'O(1)'],
    'longest-unique-window':      ['O(n)', 'O(1)'],
    'min-deletions-palindrome-chars':   ['O(n)', 'O(1)'],
    'caesar-shift-three':         ['O(n)', 'O(n)'],
    'char-frequency-report':      ['O(n)', 'O(1)'],
    'count-distinct-substrings':  ['O(n^2)', 'O(n^2)'],
    'balanced-brackets':          ['O(n)', 'O(1)'],
    'is-anagram':                 ['O(n)', 'O(1)'],
    'lcs-length':                 ['O(n * m)', 'O(min(n, m))'],
    'edit-distance':              ['O(n * m)', 'O(min(n, m))'],
    'count-occurrences-substring':['O(n * m)', 'O(1)'],
    'is-subsequence':             ['O(n)', 'O(1)'],
    'is-rotation':                ['O(n)', 'O(n)'],
    'common-chars-count':         ['O(n + m)', 'O(1)'],

    // ── medium: number theory ───────────────────────────────────────────
    'count-primes-upto':          ['O(n log log n)', 'O(n)'],
    'prime-factorisation':        ['O(sqrt n)', 'O(log n)'],
    'nth-prime':                  ['O(n log n sqrt n)', 'O(1)'],
    'euler-phi':                  ['O(sqrt n)', 'O(1)'],
    'digital-root':               ['O(1)', 'O(1)'],
    'sum-of-squares-mod':         ['O(1)', 'O(1)'],
    'count-trailing-zeros-binary':['O(log n)', 'O(1)'],
    'base-conversion':            ['O(log n)', 'O(log n)'],
    'modular-inverse':            ['O(log m)', 'O(1)'],

    // ── medium: matrices ────────────────────────────────────────────────
    'matrix-transpose':           ['O(n * m)', 'O(n * m)'],
    'matrix-diagonal-sum':        ['O(n)', 'O(1)'],
    'matrix-max-row-sum':         ['O(n * m)', 'O(1)'],
    'matrix-spiral':              ['O(n * m)', 'O(n * m)'],
    'matrix-rotate-90':           ['O(n^2)', 'O(n^2)'],
    'matrix-count-negatives':     ['O(n * m)', 'O(1)'],

    // ── medium: DP and graphs ───────────────────────────────────────────
    'climbing-stairs':            ['O(n)', 'O(1)'],
    'house-robber':               ['O(n)', 'O(1)'],
    'lis-length':                 ['O(n log n)', 'O(n)'],
    'coin-change-min':            ['O(n * k)', 'O(k)'],
    'subset-sum-exists':          ['O(n * k)', 'O(k)'],
    'count-components':           ['O(V + E a(V))', 'O(V)'],
    'bfs-shortest-path':          ['O(V + E)', 'O(V + E)'],

    // ── medium-extra: greedy ────────────────────────────────────────────
    'activity-selection':         ['O(n log n)', 'O(n)'],
    'min-platforms':              ['O(n log n)', 'O(n)'],
    'count-merged-intervals':     ['O(n log n)', 'O(n)'],
    'gas-station-start':          ['O(n)', 'O(1)'],
    'can-reach-end':              ['O(n)', 'O(1)'],
    'min-candies':                ['O(n)', 'O(n)'],
    'fractional-knapsack-density':['O(n)', 'O(1)'],

    // ── medium-extra: sorting ───────────────────────────────────────────
    'sort-by-frequency':          ['O(n log n)', 'O(n)'],
    'k-closest-to-value':         ['O(n log n)', 'O(n)'],
    'count-pairs-sorted-diff':    ['O(n log n)', 'O(n)'],
    'max-dot-after-sort':         ['O(n log n)', 'O(n)'],
    'min-dot-after-sort':         ['O(n log n)', 'O(n)'],
    'intersection-sorted':        ['O(n log n)', 'O(n)'],

    // ── medium-extra: stacks and words ──────────────────────────────────
    'evaluate-rpn':               ['O(n)', 'O(n)'],
    'valid-bracket-sequence':     ['O(n)', 'O(n)'],
    'group-anagrams-count':       ['O(n * L log L)', 'O(n * L)'],
    'longest-common-prefix-many': ['O(n * L)', 'O(L)'],
    'most-frequent-word':         ['O(n * L)', 'O(n * L)'],
    'longest-word-length':        ['O(n)', 'O(1)'],
    'count-distinct-words':       ['O(n * L)', 'O(n * L)'],
    'sort-words-by-length':       ['O(n log n * L)', 'O(n * L)'],

    // ── medium-extra: numbers ───────────────────────────────────────────
    'is-happy-number':            ['O(log n)', 'O(log n)'],
    'count-perfect-squares':      ['O(1)', 'O(1)'],
    'sum-primes-upto':            ['O(n log log n)', 'O(n)'],
    'count-armstrong-upto':       ['O(n log n)', 'O(1)'],
    'count-divisor-pairs':        ['O(sqrt n)', 'O(1)'],
    'gcd-of-array':               ['O(n log max)', 'O(1)'],
    'lcm-of-array':               ['O(n log max)', 'O(1)'],

    // ── medium-extra: DP and graphs ─────────────────────────────────────
    'tribonacci':                 ['O(n)', 'O(1)'],
    'binary-strings-no-consecutive-ones': ['O(n)', 'O(1)'],
    'tile-2xn':                   ['O(n)', 'O(1)'],
    'unique-paths-open-grid':     ['O(n * m)', 'O(m)'],
    'min-cost-climbing':          ['O(n)', 'O(1)'],
    'max-sum-increasing-subseq':  ['O(n^2)', 'O(n)'],
    'count-ways-sum-steps':       ['O(n^2)', 'O(n)'],
    'is-bipartite':               ['O(V + E)', 'O(V + E)'],
    'max-degree':                 ['O(V + E)', 'O(V)'],
    'count-triangles':            ['O(V^3)', 'O(E)'],
    'largest-component-size':     ['O(V + E a(V))', 'O(V)'],

    // ── hard: arrays, stacks, windows ───────────────────────────────────
    'trapping-rain-water':        ['O(n)', 'O(1)'],
    'largest-histogram-rectangle':['O(n)', 'O(n)'],
    'next-greater-elements':      ['O(n)', 'O(n)'],
    'count-inversions-fast':      ['O(n log n)', 'O(n)'],
    'max-xor-pair':               ['O(n log max)', 'O(n log max)'],
    'longest-arithmetic-subseq':  ['O(n^2)', 'O(n^2)'],
    'partition-equal-subset':     ['O(n * S)', 'O(S)'],
    'min-jumps':                  ['O(n)', 'O(1)'],
    'sliding-window-max':         ['O(n)', 'O(k)'],
    'subarrays-divisible-k':      ['O(n)', 'O(k)'],
    'knapsack-01':                ['O(n * k)', 'O(k)'],
    'coin-change-ways':           ['O(n * k)', 'O(k)'],
    'max-profit-k-transactions':  ['O(n * k)', 'O(k)'],

    // ── hard: strings ───────────────────────────────────────────────────
    'longest-valid-parentheses':  ['O(n)', 'O(n)'],
    'palindrome-min-cuts':        ['O(n^2)', 'O(n^2)'],
    'count-distinct-subsequences':['O(n)', 'O(1)'],
    'longest-k-distinct':         ['O(n)', 'O(1)'],
    'longest-common-substring':   ['O(n * m)', 'O(n * m)'],
    'min-window-substring':       ['O(n + m)', 'O(m)'],
    'count-subsequence-occurrences': ['O(n * m)', 'O(m)'],
    'wildcard-match':             ['O(n * m)', 'O(n * m)'],

    // ── hard: graphs ────────────────────────────────────────────────────
    'dijkstra-shortest-path':     ['O(V^2)', 'O(V + E)'],
    'mst-weight':                 ['O(E log E)', 'O(V)'],
    'graph-diameter-bounded':     ['O(V^3)', 'O(V^2)'],
    'topological-order-exists':   ['O(V + E)', 'O(V + E)'],

    // ── hard: grids ─────────────────────────────────────────────────────
    'count-islands':              ['O(n * m)', 'O(n * m)'],
    'largest-ones-rectangle':     ['O(n * m)', 'O(m)'],
    'grid-paths-obstacles':       ['O(n * m)', 'O(n * m)'],
    'min-path-sum':               ['O(n * m)', 'O(n * m)'],
    'max-sum-submatrix':          ['O(n^2 * m)', 'O(m)'],
    'shortest-grid-path':         ['O(n * m)', 'O(n * m)'],

    // ── hard: simulation and combinatorics ──────────────────────────────
    'josephus':                   ['O(n)', 'O(1)'],
    'n-queens-count':             ['O(n!)', 'O(n)'],
    'egg-drop':                   ['O(eggs * trials)', 'O(eggs)'],
    'merge-intervals-length':     ['O(n log n)', 'O(n)'],
    'min-meeting-rooms':          ['O(n log n)', 'O(n)'],
    'decode-digit-string':        ['O(n)', 'O(n)'],
    'rod-cutting':                ['O(n^2)', 'O(n)'],
    'longest-zigzag-subseq':      ['O(n)', 'O(1)'],

    // ── hard-extra: binary search on the answer ─────────────────────────
    'split-array-min-largest':    ['O(n log S)', 'O(1)'],
    'book-allocation':            ['O(n log S)', 'O(1)'],
    'aggressive-cows':            ['O(n log n + n log S)', 'O(1)'],
    'min-days-to-finish':         ['O(n log S)', 'O(1)'],
    'median-two-sorted':          ['O(n log n)', 'O(n)'],

    // ── hard-extra: dynamic programming ─────────────────────────────────
    'longest-palindromic-subsequence': ['O(n^2)', 'O(n^2)'],
    'min-insertions-palindrome':  ['O(n^2)', 'O(n^2)'],
    'matrix-chain-multiplication':['O(n^3)', 'O(n^2)'],
    'burst-balloons':             ['O(n^3)', 'O(n^2)'],
    'word-break-count':           ['O(n^2 * m)', 'O(n)'],
    'partition-k-equal-sums':     ['O(k^n)', 'O(n + k)'],
    'max-sum-no-three-consecutive': ['O(n)', 'O(n)'],

    // ── hard-extra: data structures ─────────────────────────────────────
    'count-smaller-after-self':   ['O(n^2)', 'O(n)'],
    'min-of-every-window-size':   ['O(n^3)', 'O(n)'],
    'sliding-window-min':         ['O(n)', 'O(1)'],
    'range-sum-with-updates':     ['O(q * n)', 'O(n)'],
    'lru-cache-simulation':       ['O(q * capacity)', 'O(capacity)'],

    // ── hard-extra: graphs and grids ────────────────────────────────────
    'bellman-ford-negative-cycle':['O(V * E)', 'O(V)'],
    'scc-count':                  ['O(V + E)', 'O(V + E)'],
    'max-gold-path':              ['O(n * m)', 'O(n * m)'],
    'surrounded-regions':         ['O(n * m)', 'O(n * m)'],
    'longest-substring-k-repeats':['O(n^3)', 'O(1)'],
};

module.exports = COMPLEXITY;
