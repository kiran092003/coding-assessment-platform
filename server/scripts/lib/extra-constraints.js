/* ───────────────────────────────────────────────────────────────────────────
   Constraints for the one-off problems that are declared inline rather than
   through a shared factory, so they have no generator opts to derive from.

   These mirror the bounds in each problem's own genInput.
   ─────────────────────────────────────────────────────────────────────────── */

module.exports = {
    'count-given-char': [
        '- `1 <= s.length <= 40`',
        '- `s` and `c` consist of lowercase English letters only',
    ],
    'repeat-string': [
        '- `1 <= s.length <= 10`',
        '- `1 <= k <= 8`',
    ],
    'base-conversion': [
        '- `1 <= n <= 1000000`',
        '- `2 <= b <= 36`',
    ],
    'modular-inverse': [
        '- `m` is prime and `m <= 1000000007`',
        '- `1 <= a < m`',
    ],
    'climbing-stairs': [
        '- `1 <= n <= 10000`',
    ],
    'count-components': [
        '- `2 <= n <= 40`',
        '- `1 <= m <= 80`',
        '- `1 <= u, v <= n`; self-loops and repeated edges may occur',
    ],
    'bfs-shortest-path': [
        '- `2 <= n <= 30`',
        '- `1 <= m <= 60`',
        '- `1 <= u, v <= n`; the graph may be disconnected',
    ],
    'activity-selection': [
        '- `1 <= n <= 60`',
        '- `0 <= l <= r <= 240`',
    ],
    'min-platforms': [
        '- `1 <= n <= 60`',
        '- `0 <= l <= r <= 240`',
    ],
    'count-merged-intervals': [
        '- `1 <= n <= 60`',
        '- `0 <= l <= r <= 240`',
    ],
    'evaluate-rpn': [
        '- `3 <= n <= 23`',
        '- Operands are single digits `1..9`; operators are `+`, `-` and `*`',
        '- The expression is always well formed',
    ],
    'valid-bracket-sequence': [
        '- `1 <= s.length <= 24`',
        '- `s` contains only the characters `(`, `)`, `[`, `]`, `{` and `}`',
    ],
    'group-anagrams-count': [
        '- `1 <= n <= 25`',
        '- `1 <= word.length <= 6`, lowercase letters only',
    ],
    'longest-common-prefix-many': [
        '- `1 <= n <= 25`',
        '- `1 <= word.length <= 6`, lowercase letters only',
    ],
    'most-frequent-word': [
        '- `1 <= n <= 25`',
        '- `1 <= word.length <= 3`, lowercase letters only',
    ],
    'longest-word-length': [
        '- `1 <= n <= 25`',
        '- `1 <= word.length <= 6`, lowercase letters only',
    ],
    'count-distinct-words': [
        '- `1 <= n <= 25`',
        '- `1 <= word.length <= 3`, lowercase letters only',
    ],
    'sort-words-by-length': [
        '- `1 <= n <= 25`',
        '- `1 <= word.length <= 6`, lowercase letters only',
    ],
    'is-bipartite': [
        '- `2 <= n <= 30`',
        '- `1 <= m <= 60`',
    ],
    'max-degree': [
        '- `2 <= n <= 30`',
        '- `1 <= m <= 60`',
    ],
    'count-triangles': [
        '- `2 <= n <= 25`',
        '- `1 <= m <= 50`',
    ],
    'largest-component-size': [
        '- `2 <= n <= 30`',
        '- `1 <= m <= 60`',
    ],
    'topological-order-exists': [
        '- `2 <= n <= 40`',
        '- `1 <= m <= 80`',
        '- Edges are directed; self-loops and repeated edges may occur',
    ],
    'josephus': [
        '- `1 <= n <= 5000`',
        '- `1 <= k <= 20`',
    ],
    'n-queens-count': [
        '- `1 <= n <= 11`',
    ],
    'egg-drop': [
        '- `1 <= eggs <= 8`',
        '- `1 <= floors <= 400`',
    ],
    'merge-intervals-length': [
        '- `1 <= n <= 200`',
        '- `0 <= l <= r <= 1100`',
    ],
    'min-meeting-rooms': [
        '- `1 <= n <= 200`',
        '- `0 <= start < end <= 560`',
    ],
    'decode-digit-string': [
        '- `1 <= digits.length <= 200`',
        '- The string contains decimal digits only and may contain zeros',
    ],
    'range-sum-with-updates': [
        '- `1 <= n <= 300`',
        '- `1 <= q <= 300`',
        '- `1 <= arr[i], v <= 50`; `1 <= l <= r <= n`',
    ],
    'lru-cache-simulation': [
        '- `1 <= capacity <= 8`',
        '- `1 <= q <= 300`',
        '- `1 <= key <= 12`',
    ],
    'bellman-ford-negative-cycle': [
        '- `2 <= n <= 30`',
        '- `1 <= m <= 80`',
        '- `-20 <= w <= 20`; edges are directed',
    ],
    'scc-count': [
        '- `2 <= n <= 40`',
        '- `1 <= m <= 80`; edges are directed',
    ],
};
