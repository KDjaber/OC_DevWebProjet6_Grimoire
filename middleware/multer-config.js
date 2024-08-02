const multer = require('multer');

const storage = multer.memoryStorage();

// max file size set to 100MB
module.exports = multer({ storage, limits: {filesize: 100 * 1000000} }).single('image');