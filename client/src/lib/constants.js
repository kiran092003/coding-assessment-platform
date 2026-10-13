/* Values the server also enforces. Duplicated here only so the UI can explain
   a rule before it is broken — the server stays the authority, and its message
   is what gets shown when a request is actually refused.

   Mirrors MAX_QUESTIONS_PER_CONTEST in
   server/contest-service/services/ContestQuestionService.js */
export const MAX_QUESTIONS_PER_CONTEST = 4
