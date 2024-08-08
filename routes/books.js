const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { booksRateLimit } = require('../middleware/rate-limits')
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config')
const booksCtrl = require('../controllers/books');

router.get('/', booksCtrl.getAllBooks);
router.get('/bestrating', booksCtrl.getBest);
router.post('/', booksRateLimit, auth, multer, booksCtrl.createBook);
router.get('/:id', booksCtrl.getOneBook);
router.put('/:id', booksRateLimit, auth, multer, booksCtrl.modifyBook);
router.delete('/:id', booksRateLimit, auth, booksCtrl.deleteBook);
router.post('/:id/rating',  booksRateLimit, body('rating').isInt({min: 0, max: 5}), auth, booksCtrl.addRating);

module.exports = router;