const rateLimit = require("express-rate-limit");

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15
});

const booksRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20
});


module.exports = {authRateLimit, booksRateLimit}