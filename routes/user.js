const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userCtrl = require('../controllers/user')

router.post('/signup', body('email').trim().isEmail(), body('password').trim().isLength({min:8}), userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;