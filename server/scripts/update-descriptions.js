#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   Rewrites questions.description for every seeded question, adding the
   Constraints and Expected complexity sections.

   Only the description column is touched — test cases, contests and
   submissions are left exactly as they are. Rebuilding is idempotent: an
   existing Constraints / Expected complexity block is replaced, not appended
   to, so this can be re-run after editing the complexity table.

     DB_PASSWORD=<password> node scripts/update-descriptions.js [--dry-run]
   ═══════════════════════════════════════════════════════════════════════════ */

const path = require('path');
const mysql = require(path.join(__dirname, '..', 'question-service', 'node_modules', 'mysql2', 'promise'));
const { buildDescription } = require('./lib/describe');

const ARCHETYPES = [].concat(
    require('./archetypes/easy'),
    require('./archetypes/easy-extra'),
    require('./archetypes/medium'),
    require('./archetypes/medium-extra'),
    require('./archetypes/hard'),
    require('./archetypes/hard-extra'),
);

const DRY_RUN = process.argv.includes('--dry-run');

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

async function main() {
    const byTitle = new Map(ARCHETYPES.map((a) => [a.title, a]));

    if (DRY_RUN) {
        const sample = ARCHETYPES.find((a) => a.slug === 'array-count-even') || ARCHETYPES[0];
        console.log('--dry-run. Example rebuilt statement:\n');
        console.log('─'.repeat(70));
        console.log(buildDescription(sample));
        console.log('─'.repeat(70));

        const missing = ARCHETYPES.filter((a) => !buildDescription(a).includes('**Expected complexity**'));
        console.log(`\nArchetypes without a complexity entry: ${missing.length}`);
        const noConstraints = ARCHETYPES.filter((a) => !buildDescription(a).includes('**Constraints**'));
        console.log(`Archetypes without constraints        : ${noConstraints.length}`);
        if (noConstraints.length) console.log('  ' + noConstraints.map((a) => a.slug).join(', '));
        return;
    }

    const conn = await mysql.createConnection(DB);
    console.log(`Connected to ${DB.host}:${DB.port}/${DB.database}`);

    try {
        const [rows] = await conn.query('SELECT id, title FROM questions');

        let updated = 0;
        let skipped = 0;

        for (const row of rows) {
            const a = byTitle.get(row.title);
            if (!a) { skipped++; continue; }

            await conn.execute('UPDATE questions SET description = ? WHERE id = ?', [
                buildDescription(a),
                row.id,
            ]);
            updated++;
            if (updated % 50 === 0) console.log(`  ${updated} updated...`);
        }

        console.log(`\nUpdated ${updated} descriptions`);
        console.log(`Skipped ${skipped} (authored outside the seeder — left untouched)`);

        const [[check]] = await conn.query(`
            SELECT SUM(description LIKE '%**Constraints**%')         AS with_constraints,
                   SUM(description LIKE '%**Expected complexity**%') AS with_complexity,
                   COUNT(*)                                          AS total
              FROM questions
        `);
        console.log(`\nOf ${check.total} questions: ${check.with_constraints} carry constraints, ${check.with_complexity} carry complexity.`);
    } finally {
        await conn.end();
    }
}

main().catch((err) => { console.error('failed:', err.message); process.exit(1); });
