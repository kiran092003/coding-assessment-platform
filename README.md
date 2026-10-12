# CodeArena

A microservice online judge: authored problems, timed contests with partial
scoring, and sandboxed code execution in C, C++, Java, Python and JavaScript.

## Architecture

An API gateway fronts six Node services, all sharing one MySQL database.
Submissions are queued through RabbitMQ; Redis handles caching and the
leaderboard's live updates.

| Service | Port | Responsibility |
| --- | --- | --- |
| api-gateway | 4000 | Routing, rate limiting |
| auth-service | 4001 | Registration, login, JWT issuing |
| question-service | 4002 | Problems and test cases |
| contest-service | 4003 | Contests, registration, contest papers |
| submission-service | 4004 | Submission intake and eligibility |
| judge-service | 4005 | Sandboxed execution and verdicts |
| leaderboard-service | 4006 | Scoring, live standings over WebSocket |
| frontend | 80 | React + Vite, served by nginx |

The judge runs each submission in a throwaway container with no network, a
256 MB memory cap, 0.5 CPU, a 50-process limit and a 5 s wall clock.

## Setup

Requires Docker Desktop and Node 20+ (Node is only needed to run the seeder).

**1. Secrets**

```bash
cd server
cp .env.example .env
```

Fill in `.env`. Generate strong values:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Anyone holding `JWT_SECRET` can mint an admin token, so treat it as a
password. `docker compose` refuses to start if these are unset.

**2. Start the stack**

```bash
docker compose up -d
```

**3. Create the schema**

A fresh database starts empty — the compose file does not auto-run any SQL.

```bash
docker exec -i mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
    coding_assessment_platform < migrations/000_baseline_schema.sql
```

`000` creates all 10 tables with no rows. `001_contest_integrity.sql` is only
needed to upgrade a database created before `test_cases.is_hidden` and
`questions.is_contest_only` existed; it is idempotent either way.

**4. Create an admin**

Register at http://localhost, then promote the account:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

**5. Seed sample content (optional)**

Nothing runs this for you — a clone gets an empty database unless you ask
otherwise.

```bash
cd server
DB_PASSWORD=<your password> node scripts/seed.js
```

That writes 220 practice questions (100 easy / 70 medium / 50 hard), 40
contest-only questions, 2,600 test cases and 10 contests. Flags: `--dry-run`
to preview, `--fresh` to replace previously seeded rows.

Seed data is generated from the problem archetypes in
`server/scripts/archetypes/`. Each archetype carries a reference solution that
*computes* every expected output, so the test data is correct by construction
and a reseed reproduces it byte for byte.

## Anti-cheat model

Contest integrity is enforced server-side, never in the UI.

- **Hidden test cases.** Each question has sample cases, shown as worked
  examples, and hidden cases that decide the verdict. Hidden cases and their
  expected outputs never leave the server. `Run` executes samples only;
  `Submit` scores against everything.
- **Two question pools.** Contest problems carry `is_contest_only` and are
  excluded from the practice list, so they cannot be rehearsed — or have their
  samples read — before the contest opens. Only contest-only questions can be
  mapped to a contest.
- **Sealed papers.** A contest's questions resolve only once it has started
  *and* the caller is registered.
- **Verified submissions.** Every submission re-derives from the database that
  the contest is running, that the user registered, and that the question is on
  that contest's paper. Nothing is taken from the client.
- **Caches are scoped by audience**, so an admin's view of a question or test
  case is never served to a regular user on a cache hit.

## Development

```bash
cd client && npm install && npm run dev     # Vite on :3000
```

Set `VITE_API_URL=http://localhost:4000` in `client/.env` so the dev server
reaches the gateway.

To rebuild a single service after a change:

```bash
cd server && docker compose up -d --build <service>
```

## Note on ports

`docker compose` publishes the container's MySQL on host port **3307**, not
3306. If you have a local MySQL install it will occupy 3306 and is a different
server — connecting a client there shows a different (or empty) database.
