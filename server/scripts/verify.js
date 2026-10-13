#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   Re-derives every stored expected_output from its archetype's reference
   solution and reports any that disagree.

   This is the check that the seeded data actually matches the question text:
   it reads the rows back out of the database and recomputes them, rather than
   trusting that the seeder wrote what it meant to.

     DB_PASSWORD=<password> node scripts/verify.js
   ═══════════════════════════════════════════════════════════════════════════ */

const path = require('path');
const mysql = require(path.join(__dirname, '..', 'question-service', 'node_modules', 'mysql2', 'promise'));

const ARCHETYPES = [].concat(
    require('./archetypes/easy'),
    require('./archetypes/easy-extra'),
    require('./archetypes/medium'),
    require('./archetypes/medium-extra'),
    require('./archetypes/hard'),
    require('./archetypes/hard-extra'),
);

const DB = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'coding_assessment_platform',
};

if (!DB.password) {
    console.error('DB_PASSWORD is not set.');
    process.exit(1);
}

const norm = (v) => String(v).replace(/\r\n/g, '\n').trim();

async function main() {
    const byTitle = new Map(ARCHETYPES.map((a) => [a.title, a]));
    const conn = await mysql.createConnection(DB);

    try {
        const [rows] = await conn.query(`
            SELECT q.id AS qid, q.title, q.difficluty,
                   tc.id AS tcid, tc.input_data, tc.expected_output, tc.is_hidden
              FROM test_cases tc
              JOIN questions q ON q.id = tc.question_id
             ORDER BY q.id, tc.id
        `);

        let checked = 0;
        let unknown = 0;
        const mismatches = [];
        const unknownTitles = new Set();

        for (const r of rows) {
            const a = byTitle.get(r.title);
            if (!a) { unknown++; unknownTitles.add(r.title); continue; }

            let actual;
            try {
                actual = a.solve(r.input_data);
            } catch (err) {
                mismatches.push({ ...r, actual: `THREW: ${err.message}` });
                continue;
            }

            checked++;
            if (norm(actual) !== norm(r.expected_output)) {
                mismatches.push({ ...r, actual });
            }
        }

        console.log(`Checked   : ${checked} test cases across ${new Set(rows.map(r => r.qid)).size} questions`);
        console.log(`Skipped   : ${unknown} (no matching archetype — authored outside the seeder)`);
        if (unknownTitles.size) {
            console.log(`            ${Array.from(unknownTitles).join(', ')}`);
        }
        console.log(`Mismatched: ${mismatches.length}`);

        if (mismatches.length) {
            console.log('\nFirst 20 mismatches:');
            for (const m of mismatches.slice(0, 20)) {
                console.log(`\n  [${m.title}] test case #${m.tcid}${m.is_hidden ? ' (hidden)' : ''}`);
                console.log(`    input    : ${JSON.stringify(m.input_data).slice(0, 120)}`);
                console.log(`    stored   : ${JSON.stringify(m.expected_output).slice(0, 120)}`);
                console.log(`    recomputed: ${JSON.stringify(String(m.actual)).slice(0, 120)}`);
            }
            process.exitCode = 1;
        } else {
            console.log('\nEvery stored expected_output matches its reference solution.');
        }
    } finally {
        await conn.end();
    }
}

main().catch((err) => { console.error('verify failed:', err.message); process.exit(1); });
