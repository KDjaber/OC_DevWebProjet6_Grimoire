const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User')

// create user and adds it to database
exports.signup = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        if(result.array().some(err => err.path === "password")) {
            res.status(400).json({ message: 'Mot de passe invalide' })
            return;
        }

        if(result.array().some(err => err.path === "email")) {
            res.status(400).json({ message: 'Email invalide' })
            return;
        }
    }

    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }))
        })
        .catch(error => res.status(500).json({ error }))
};

//user login
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user === null) {
                res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte' })
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte' })
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    process.env.SECRET_TOKEN,
                                    { expiresIn: '24h' }
                                )
                            })
                        }
                    })
                    .catch(error => res.status(500).json({ error }))
            }
        })
        .catch(error => res.status(500).json({ error }))
};