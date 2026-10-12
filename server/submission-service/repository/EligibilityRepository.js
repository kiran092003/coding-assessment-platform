const pool = require("../db/connect");

/**
 * Everything needed to decide whether a submission is allowed, in one query.
 *
 * All services share a single database, so these invariants are checked here
 * rather than over the network — a submission is the one action that mints
 * score, so it must not depend on the client telling the truth.
 */
const GetQuestionPoolFlag = async (questionId) => {

    const [rows] = await pool.execute(
        `SELECT id, is_contest_only FROM questions WHERE id = ?`,
        [questionId]
    );

    return rows[0];
};

const GetContestEligibility = async (contestId, questionId, userId) => {

    const [rows] = await pool.execute(
        `SELECT c.id,
                c.start_time,
                c.end_time,
                NOW() < c.start_time                      AS not_started,
                NOW() > c.end_time                        AS has_ended,
                EXISTS (
                    SELECT 1 FROM contest_registrations r
                     WHERE r.contest_id = c.id AND r.user_id = ?
                ) AS is_registered,
                EXISTS (
                    SELECT 1 FROM contest_questions cq
                     WHERE cq.contest_id = c.id AND cq.question_id = ?
                ) AS question_in_contest
           FROM contests c
          WHERE c.id = ?`,
        [userId, questionId, contestId]
    );

    return rows[0];
};

module.exports = { GetQuestionPoolFlag, GetContestEligibility };
