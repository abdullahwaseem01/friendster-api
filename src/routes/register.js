require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const User = require('../models/user.js');
const generateToken = require('../authentication/authenticate.js').generateToken;
router = express.Router();
const saltRounds = Number(process.env.SALT_ROUNDS);

router.post('/register', (req, res) => {
    const { username, email, password, name, age, avatar, profileStatus } = req.body;
    const token = generateToken(username, email, name, age, avatar, profileStatus);
    const refreshToken = jwt.sign({ username, email, name, age, avatar, profileStatus }, process.env.JWT_REFRESH_SECRET);
    bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (!err) {
            const password = await hash;
            const user = new User({ username, email, password, name, age, avatar, profileStatus, token, refreshToken });
            user.save((error) => {
                if (!error) {
                    res.status(200).json({
                        message: 'User created successfully',
                        token: token,
                        refreshToken: refreshToken
                    });
                } else {
                    res.status(400).json({
                        message: 'Error creating user',
                        error: error
                    });
                }
            });
        } else {
            res.status(500).json({
                message: 'Error hashing password',
                error: err
            });
        }

    });

});

module.exports = router;