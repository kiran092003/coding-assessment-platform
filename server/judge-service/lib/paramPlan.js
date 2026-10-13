/* ───────────────────────────────────────────────────────────────────────────
   Works out how to read a Solution method's parameters off stdin.

   Input is a flat stream of whitespace-separated tokens — brackets and commas
   count as whitespace, so "[2,7,11,15]" and "2 7 11 15" are the same thing.
   Each parameter then consumes a known number of tokens:

     scalars                 one token
     vector<T>               as many as a preceding size parameter says
     vector<vector<int>>     rows x cols

   Sizing follows the convention the problems are written in: a length is
   always given before the data it describes. Which preceding integer applies
   is resolved by name — `n` when present, otherwise the nearest one — which
   covers every signature in the question bank:

     int n, vector<int> arr                        arr is n long
     int n, int k, vector<int> arr                 arr is n long, not k
     int capacity, int q, vector<int> keys         keys is q long
     vector<int>& nums, int target                 nums takes all but the last
     int n, int m, vector<vector<int>> grid        n rows of m
     int n, int m, vector<vector<int>> edges       m rows, width inferred
     int n, vector<vector<int>> intervals          n rows, width inferred
   ─────────────────────────────────────────────────────────────────────────── */

const KIND = {
    INT: 'int',
    LONG: 'long',
    DOUBLE: 'double',
    BOOL: 'bool',
    CHAR: 'char',
    STRING: 'string',
    VEC_INT: 'vector<int>',
    VEC_STR: 'vector<string>',
    MATRIX: 'vector<vector<int>>',
};

function classify(type) {
    if (/vector\s*<\s*vector\s*<\s*int/.test(type)) return KIND.MATRIX;
    if (/vector\s*<\s*int\s*>/.test(type)) return KIND.VEC_INT;
    if (/vector\s*<\s*string\s*>/.test(type)) return KIND.VEC_STR;
    if (/long\s+long/.test(type)) return KIND.LONG;
    if (/\bdouble\b|\bfloat\b/.test(type)) return KIND.DOUBLE;
    if (/\bbool\b|\bboolean\b/.test(type)) return KIND.BOOL;
    if (/\bchar\b/.test(type)) return KIND.CHAR;
    if (/\bstring\b|\bString\b/.test(type)) return KIND.STRING;
    return KIND.INT;
}

const SCALARS = new Set([KIND.INT, KIND.LONG, KIND.DOUBLE, KIND.BOOL, KIND.CHAR, KIND.STRING]);

/**
 * @param {string[]} rawParams  e.g. ["int n", "vector<int>& arr"]
 * @returns {Array<{index, kind, name, size, rows, cols, tailScalars}>}
 *          `size`/`rows` are either {from: <paramIndex>} or {remainder: true}.
 */
function planParams(rawParams) {
    const parsed = rawParams.map((raw, index) => {
        const clean = String(raw).replace(/&/g, ' ').replace(/\*/g, ' ').replace(/\bconst\b/g, ' ').trim();
        const bits = clean.split(/\s+/);
        const name = bits.length > 1 ? bits[bits.length - 1] : `p${index}`;
        const type = bits.length > 1 ? bits.slice(0, -1).join(' ') : clean;
        return { index, name, type, kind: classify(type) };
    });

    const intsBefore = (i) =>
        parsed.slice(0, i).filter(p => p.kind === KIND.INT || p.kind === KIND.LONG);

    return parsed.map((p, i) => {
        const plan = { ...p };

        if (SCALARS.has(p.kind)) return plan;

        const preceding = intsBefore(i);
        const namedN = preceding.find(q => q.name === 'n');
        // How many single-token parameters still follow — a greedy vector must
        // leave room for them (this is what makes `nums, target` work).
        const tailScalars = parsed.slice(i + 1).filter(q => SCALARS.has(q.kind)).length;
        plan.tailScalars = tailScalars;

        if (p.kind === KIND.VEC_INT || p.kind === KIND.VEC_STR) {
            const sizer = namedN || preceding[preceding.length - 1];
            plan.size = sizer ? { from: sizer.index } : { remainder: true };
            return plan;
        }

        // Matrix. A parameter actually called `grid` is the n-by-m case;
        // anything else (edges, intervals, queries, meetings) is "this many
        // rows, work the width out from what is left".
        if (p.name === 'grid' && preceding.length >= 2) {
            plan.rows = { from: (namedN || preceding[0]).index };
            const other = preceding.find(q => q.index !== plan.rows.from);
            plan.cols = { from: other ? other.index : preceding[1].index };
        } else if (preceding.length) {
            plan.rows = { from: preceding[preceding.length - 1].index };
            plan.cols = { derive: true }; // remaining / rows
        } else {
            plan.rows = { remainder: true };
            plan.cols = { derive: true };
        }
        return plan;
    });
}

module.exports = { KIND, SCALARS, classify, planParams };
