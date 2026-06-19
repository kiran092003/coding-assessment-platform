const counters = { scoresProcessed: 0 };

const increment = (key) => { counters[key] = (counters[key] || 0) + 1; };
const getAll = () => ({ ...counters });

module.exports = { increment, getAll };
