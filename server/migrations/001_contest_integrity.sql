-- ─────────────────────────────────────────────────────────────────────────────
-- 001_contest_integrity.sql
--
-- Adds the two columns the anti-cheat model needs:
--
--   test_cases.is_hidden        Sample cases (0) are shown to solvers as
--                              worked examples. Hidden cases (1) are the ones
--                              that actually decide the verdict and must never
--                              leave the server.
--
--   questions.is_contest_only   Contest questions live in a private pool that
--                              is excluded from the practice problem set, so a
--                              contest problem can't be rehearsed beforehand.
--
-- Also backfills the missing contest_id foreign key on submissions.
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── test_cases.is_hidden ────────────────────────────────────────────────────
SET @exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'test_cases'
      AND COLUMN_NAME  = 'is_hidden'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE test_cases ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'test_cases'
      AND INDEX_NAME   = 'idx_testcase_question_hidden'
);
SET @sql := IF(@exists = 0,
    'CREATE INDEX idx_testcase_question_hidden ON test_cases (question_id, is_hidden)',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── questions.is_contest_only ───────────────────────────────────────────────
SET @exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'questions'
      AND COLUMN_NAME  = 'is_contest_only'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE questions ADD COLUMN is_contest_only TINYINT(1) NOT NULL DEFAULT 0',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'questions'
      AND INDEX_NAME   = 'idx_question_pool'
);
SET @sql := IF(@exists = 0,
    'CREATE INDEX idx_question_pool ON questions (is_contest_only, difficluty)',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Any question already mapped to a contest belongs to the private pool.
UPDATE questions q
   SET q.is_contest_only = 1
 WHERE EXISTS (SELECT 1 FROM contest_questions cq WHERE cq.question_id = q.id);

-- ── submissions.contest_id foreign key ──────────────────────────────────────
-- Clear orphaned references first so the constraint can be created.
UPDATE submissions s
   SET s.contest_id = NULL
 WHERE s.contest_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM contests c WHERE c.id = s.contest_id);

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA     = DATABASE()
      AND TABLE_NAME       = 'submissions'
      AND CONSTRAINT_NAME  = 'submissions_contest_fk'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE submissions
        ADD CONSTRAINT submissions_contest_fk
        FOREIGN KEY (contest_id) REFERENCES contests (id) ON DELETE SET NULL',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'submissions'
      AND INDEX_NAME   = 'idx_submission_user_contest'
);
SET @sql := IF(@exists = 0,
    'CREATE INDEX idx_submission_user_contest ON submissions (user_id, contest_id, question_id)',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
