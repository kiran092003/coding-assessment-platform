/* ───────────────────────────────────────────────────────────────────────────
   Composes a problem statement in the familiar judge layout:

     <what to do>

     **Input** / **Output**        the stdin and stdout contract
     **Constraints**               the bounds the tests actually respect
     **Expected complexity**       the intended optimal solution

   Worked examples are deliberately not embedded here — the solve page renders
   the question's sample test cases directly beneath the statement, and
   duplicating them would put two sources of truth on one screen.
   ─────────────────────────────────────────────────────────────────────────── */

const COMPLEXITY = require('./complexity');
const EXTRA_CONSTRAINTS = require('./extra-constraints');

/* The statement as written by the archetype, with any previously appended
   Constraints / Expected complexity sections stripped so rebuilding is
   idempotent. */
function baseStatement(archetype) {
    return String(archetype.description)
        .split('\n**Constraints**')[0]
        .split('\n**Expected complexity**')[0]
        .replace(/\s+$/, '');
}

function constraintsFor(archetype) {
    const own = archetype.constraints;
    if (own && own.length) return own;
    return EXTRA_CONSTRAINTS[archetype.slug] || null;
}

function buildDescription(archetype) {
    const parts = [baseStatement(archetype)];

    const constraints = constraintsFor(archetype);
    if (constraints) {
        parts.push('**Constraints**\n' + constraints.join('\n'));
    }

    const cx = COMPLEXITY[archetype.slug];
    if (cx) {
        parts.push(
            '**Expected complexity**\n' +
            `- Time \`${cx[0]}\`\n` +
            `- Space \`${cx[1]}\``,
        );
    }

    return parts.join('\n\n');
}

module.exports = { buildDescription, constraintsFor, baseStatement };
