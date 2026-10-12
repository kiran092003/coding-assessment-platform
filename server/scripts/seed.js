#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   Seeds questions, test cases, contests and contest mappings.

   Practice pool   100 Low + 70 Medium + 50 High = 220 questions
   Contest pool     10 Low + 20 Medium + 10 High =  40 questions
   Test cases       8 sample + 2 hidden per question (2,600 rows)
   Contests         10, each mapped to 4 questions from the private pool

   The two pools are disjoint, and contest questions carry is_contest_only = 1
   so they never appear in the practice list — a contest problem cannot be
   rehearsed, or have its samples read, before the contest opens.

   Every expected output is produced by the archetype's reference solution,
   so the seeded test data is correct by construction rather than by hand.

   Usage:
     node scripts/seed.js              # insert, skipping anything already there
     node scripts/seed.js --fresh      # delete previously seeded rows, then insert
     node scripts/seed.js --dry-run    # report what would be written
   ═══════════════════════════════════════════════════════════════════════════ */

const path = require('path');
const mysql = require(path.join(__dirname, '..', 'question-service', 'node_modules', 'mysql2', 'promise'));
const { rngFor } = require('./lib/util');

const ARCHETYPES = [].concat(
    require('./archetypes/easy'),
    require('./archetypes/easy-extra'),
    require('./archetypes/medium'),
    require('./archetypes/medium-extra'),
    require('./archetypes/hard'),
    require('./archetypes/hard-extra'),
);

/* ── Configuration ─────────────────────────────────────────────────────── */

const PRACTICE_QUOTA = { Low: 100, Medium: 70, High: 50 };
const CONTEST_QUOTA   = { Low: 10,  Medium: 20, High: 10 };

const SAMPLE_CASES = 8;
const HIDDEN_CASES = 2;

const CONTEST_COUNT = 10;
const CONTEST_SHAPE = ['Low', 'Medium', 'Medium', 'High']; // 4 questions each
const POINTS = { Low: 100, Medium: 200, High: 300 };

/* Port 3307 is where docker-compose publishes the container's MySQL. A local
   MySQL install on 3306 is a different server — seeding that one writes rows
   the application never reads. */
const DB = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'coding_assessment_platform',
    multipleStatements: false,
};

if (!DB.password) {
    console.error(
        'DB_PASSWORD is not set.\n' +
        '  PowerShell:  $env:DB_PASSWORD = "<password>"; node scripts/seed.js\n' +
        '  bash:        DB_PASSWORD=<password> node scripts/seed.js',
    );
    process.exit(1);
}

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const DRY_RUN = args.includes('--dry-run');

/* ── Helpers ───────────────────────────────────────────────────────────── */

/* Stable per-question seed, so a reseed reproduces identical test data. */
const seedOf = (slug) => {
    let h = 2166136261;
    for (let i = 0; i < slug.length; i++) {
        h ^= slug.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

/**
 * Builds the 10 cases for one question.
 *
 * Distinct inputs matter: duplicates would make the hidden cases redundant and
 * let a partially-correct solution score higher than it should. Generation
 * retries until it has 10 unique inputs, then falls back to accepting fewer
 * rather than looping forever on a problem whose input space is tiny.
 */
function buildTestCases(archetype) {
    const rng = rngFor(seedOf(archetype.slug));
    const wanted = SAMPLE_CASES + HIDDEN_CASES;
    const seen = new Set();
    const cases = [];

    for (let attempt = 0; attempt < wanted * 40 && cases.length < wanted; attempt++) {
        const caseIdx = cases.length;
        const input = archetype.genInput(rng, caseIdx);
        if (seen.has(input)) continue;
        seen.add(input);

        const expected = archetype.solve(input);
        if (expected === undefined || expected === null) {
            throw new Error(`${archetype.slug}: reference solution returned nothing`);
        }

        cases.push({
            input: String(input).replace(/\s+$/, ''),
            expected: String(expected).replace(/\s+$/, ''),
            // The last two are the hidden ones that decide the verdict.
            isHidden: cases.length >= SAMPLE_CASES ? 1 : 0,
        });
    }

    if (cases.length < wanted) {
        // Mark the tail as hidden regardless of how many we got.
        for (let i = Math.max(0, cases.length - HIDDEN_CASES); i < cases.length; i++) {
            cases[i].isHidden = 1;
        }
    }

    return cases;
}

/* Selects disjoint practice and contest pools, deterministically. */
function selectPools() {
    const byDifficulty = { Low: [], Medium: [], High: [] };
    for (const a of ARCHETYPES) byDifficulty[a.difficulty].push(a);

    for (const d of Object.keys(byDifficulty)) {
        byDifficulty[d].sort((x, y) => (x.slug < y.slug ? -1 : 1));
    }

    const practice = [];
    const contest = [];

    for (const d of ['Low', 'Medium', 'High']) {
        const pool = byDifficulty[d];
        const need = PRACTICE_QUOTA[d] + CONTEST_QUOTA[d];

        if (pool.length < need) {
            throw new Error(
                `Not enough ${d} archetypes: have ${pool.length}, need ${need} ` +
                `(${PRACTICE_QUOTA[d]} practice + ${CONTEST_QUOTA[d]} contest)`,
            );
        }

        practice.push(...pool.slice(0, PRACTICE_QUOTA[d]));
        contest.push(...pool.slice(PRACTICE_QUOTA[d], need));
    }

    return { practice, contest };
}

/* Ten contests spread across ended, live and upcoming windows. */
function buildContests() {
    const now = Date.now();
    const HOUR = 3600 * 1000;
    const DAY = 24 * HOUR;
    const fmt = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

    const specs = [
        { title: 'CodeArena Opener #1',       offset: -21 * DAY, hours: 2 },
        { title: 'CodeArena Opener #2',       offset: -14 * DAY, hours: 2 },
        { title: 'Algorithms Sprint #1',      offset:  -7 * DAY, hours: 3 },
        { title: 'Data Structures Cup #1',    offset:  -2 * DAY, hours: 2 },
        { title: 'CodeArena Live Round',      offset:  -1 * HOUR, hours: 4 },
        { title: 'Weekly Challenge #1',       offset:   1 * DAY, hours: 2 },
        { title: 'Weekly Challenge #2',       offset:   3 * DAY, hours: 2 },
        { title: 'Dynamic Programming Derby', offset:   5 * DAY, hours: 3 },
        { title: 'Graph Theory Grand Prix',   offset:  10 * DAY, hours: 3 },
        { title: 'CodeArena Championship',    offset:  17 * DAY, hours: 5 },
    ].slice(0, CONTEST_COUNT);

    return specs.map((s) => {
        const start = now + s.offset;
        const state = start > now ? 'upcoming' : (start + s.hours * HOUR > now ? 'live' : 'ended');
        return {
            title: s.title,
            description:
                `A ${s.hours}-hour contest with ${CONTEST_SHAPE.length} problems: ` +
                `${CONTEST_SHAPE.filter((d) => d === 'Low').length} easy, ` +
                `${CONTEST_SHAPE.filter((d) => d === 'Medium').length} medium and ` +
                `${CONTEST_SHAPE.filter((d) => d === 'High').length} hard. ` +
                'Partial scoring applies: every passing test case earns points.',
            startTime: fmt(start),
            endTime: fmt(start + s.hours * HOUR),
            state,
        };
    });
}

/* ── Main ──────────────────────────────────────────────────────────────── */

async function main() {
    const { practice, contest } = selectPools();
    const contests = buildContests();

    console.log('Seed plan');
    console.log('  practice questions :', practice.length,
        `(Low ${PRACTICE_QUOTA.Low}, Medium ${PRACTICE_QUOTA.Medium}, High ${PRACTICE_QUOTA.High})`);
    console.log('  contest questions  :', contest.length,
        `(Low ${CONTEST_QUOTA.Low}, Medium ${CONTEST_QUOTA.Medium}, High ${CONTEST_QUOTA.High})`);
    console.log('  test cases         :', (practice.length + contest.length) * (SAMPLE_CASES + HIDDEN_CASES),
        `(${SAMPLE_CASES} sample + ${HIDDEN_CASES} hidden each)`);
    console.log('  contests           :', contests.length, `× ${CONTEST_SHAPE.length} questions`);

    // Build everything (and so validate every reference solution) before touching the DB.
    const all = [].concat(
        practice.map((a) => ({ archetype: a, contestOnly: 0 })),
        contest.map((a) => ({ archetype: a, contestOnly: 1 })),
    );

    console.log('\nGenerating test data...');
    let caseTotal = 0;
    for (const item of all) {
        item.cases = buildTestCases(item.archetype);
        caseTotal += item.cases.length;
        if (item.cases.length < SAMPLE_CASES + HIDDEN_CASES) {
            console.warn(`  ! ${item.archetype.slug}: only ${item.cases.length} distinct cases available`);
        }
    }
    console.log(`  generated ${caseTotal} test cases across ${all.length} questions`);

    const titles = all.map((i) => i.archetype.title);
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    if (dupes.length) throw new Error('Duplicate question titles: ' + Array.from(new Set(dupes)).join(', '));

    if (DRY_RUN) {
        console.log('\n--dry-run: nothing written. Sample of the first question:');
        const s = all[0];
        console.log('  title   :', s.archetype.title, `(${s.archetype.difficulty})`);
        console.log('  case 1  :', JSON.stringify(s.cases[0].input), '->', JSON.stringify(s.cases[0].expected));
        console.log('  hidden  :', s.cases.filter((c) => c.isHidden).length);
        return;
    }

    const conn = await mysql.createConnection(DB);
    console.log(`\nConnected to ${DB.host}:${DB.port}/${DB.database}`);

    try {
        const [admins] = await conn.execute(
            "SELECT id, name FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1",
        );
        if (!admins.length) {
            throw new Error('No ADMIN user exists. Register one before seeding — questions need an owner.');
        }
        const adminId = admins[0].id;
        console.log(`Authoring as admin #${adminId} (${admins[0].name})`);

        if (FRESH) {
            console.log('\n--fresh: removing previously seeded rows...');
            // Test cases and mappings cascade from questions and contests.
            const [qDel] = await conn.query(
                'DELETE FROM questions WHERE title IN (?)', [titles],
            );
            const [cDel] = await conn.query(
                'DELETE FROM contests WHERE title IN (?)', [contests.map((c) => c.title)],
            );
            console.log(`  removed ${qDel.affectedRows} questions and ${cDel.affectedRows} contests`);
        }

        // ── Questions + test cases ──
        const [existingRows] = await conn.query('SELECT title FROM questions WHERE title IN (?)', [titles]);
        const existing = new Set(existingRows.map((r) => r.title));
        if (existing.size) console.log(`\n${existing.size} question(s) already present — skipping those`);

        console.log('\nInserting questions and test cases...');
        const questionIdByTitle = new Map();
        let inserted = 0;
        let caseRows = 0;

        for (const item of all) {
            const a = item.archetype;

            if (existing.has(a.title)) {
                const [[row]] = await conn.query('SELECT id FROM questions WHERE title = ? LIMIT 1', [a.title]);
                if (row) questionIdByTitle.set(a.title, row.id);
                continue;
            }

            const [res] = await conn.execute(
                `INSERT INTO questions (title, description, difficluty, return_type, params, created_by, is_contest_only)
                 VALUES (?,?,?,?,?,?,?)`,
                [a.title, a.description, a.difficulty, a.returnType, a.params, adminId, item.contestOnly],
            );
            const qid = res.insertId;
            questionIdByTitle.set(a.title, qid);
            inserted++;

            // One multi-row insert per question keeps the round trips down.
            const values = item.cases.map((c) => [qid, c.input, c.expected, adminId, c.isHidden]);
            await conn.query(
                `INSERT INTO test_cases (question_id, input_data, expected_output, created_by, is_hidden)
                 VALUES ?`,
                [values],
            );
            caseRows += values.length;

            if (inserted % 50 === 0) console.log(`  ${inserted} questions...`);
        }

        console.log(`  inserted ${inserted} questions and ${caseRows} test cases`);

        // ── Contests ──
        console.log('\nInserting contests...');
        const contestPoolByDiff = { Low: [], Medium: [], High: [] };
        for (const a of contest) contestPoolByDiff[a.difficulty].push(a.title);

        const cursor = { Low: 0, Medium: 0, High: 0 };
        let contestsInserted = 0;
        let mappings = 0;

        for (const c of contests) {
            const [[dupe]] = await conn.query('SELECT id FROM contests WHERE title = ? LIMIT 1', [c.title]);
            let contestId;

            if (dupe) {
                contestId = dupe.id;
                console.log(`  "${c.title}" already present — reusing #${contestId}`);
            } else {
                const [res] = await conn.execute(
                    `INSERT INTO contests (title, description, start_time, end_time, created_by)
                     VALUES (?,?,?,?,?)`,
                    [c.title, c.description, c.startTime, c.endTime, adminId],
                );
                contestId = res.insertId;
                contestsInserted++;
            }

            for (const diff of CONTEST_SHAPE) {
                const title = contestPoolByDiff[diff][cursor[diff]++];
                if (!title) throw new Error(`Ran out of ${diff} contest questions`);

                const qid = questionIdByTitle.get(title);
                if (!qid) continue;

                await conn.execute(
                    `INSERT INTO contest_questions (contest_id, question_id, points)
                     VALUES (?,?,?)
                     ON DUPLICATE KEY UPDATE points = VALUES(points)`,
                    [contestId, qid, POINTS[diff]],
                );
                mappings++;
            }

            console.log(`  ${c.title.padEnd(30)} ${c.state.padEnd(8)} ${c.startTime} → ${c.endTime}`);
        }

        console.log(`  inserted ${contestsInserted} contests and ${mappings} question mappings`);

        // ── Summary ──
        const [[totals]] = await conn.query(`
            SELECT (SELECT COUNT(*) FROM questions)                              AS questions,
                   (SELECT COUNT(*) FROM questions WHERE is_contest_only = 0)    AS practice,
                   (SELECT COUNT(*) FROM questions WHERE is_contest_only = 1)    AS contest_only,
                   (SELECT COUNT(*) FROM test_cases)                             AS test_cases,
                   (SELECT COUNT(*) FROM test_cases WHERE is_hidden = 1)          AS hidden_cases,
                   (SELECT COUNT(*) FROM contests)                               AS contests,
                   (SELECT COUNT(*) FROM contest_questions)                      AS mappings
        `);

        console.log('\nDatabase now holds');
        console.log('  questions      :', totals.questions, `(${totals.practice} practice, ${totals.contest_only} contest-only)`);
        console.log('  test cases     :', totals.test_cases, `(${totals.hidden_cases} hidden)`);
        console.log('  contests       :', totals.contests, `with ${totals.mappings} question mappings`);

        const [byDiff] = await conn.query(`
            SELECT difficluty, is_contest_only, COUNT(*) AS n
              FROM questions GROUP BY difficluty, is_contest_only ORDER BY is_contest_only, difficluty
        `);
        console.log('\n  pool            difficulty   count');
        for (const row of byDiff) {
            console.log('  ' + (row.is_contest_only ? 'contest-only' : 'practice').padEnd(15)
                + String(row.difficluty).padEnd(12) + row.n);
        }
    } finally {
        await conn.end();
    }
}

main().then(
    () => { console.log('\nDone.'); process.exit(0); },
    (err) => { console.error('\nSeed failed:', err.message); process.exit(1); },
);
