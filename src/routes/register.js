require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const User = require('../models/user.js');

const generateToken = require('../authentication/authenticate.js').generateToken;
router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/register', (req, res) => {
    const { username, email, password, name, age, avatar, profileStatus } = req.body;
    const token = generateToken(username, email, name, age, avatar, profileStatus);
    const refreshToken = jwt.sign({ username, email, name, age, avatar, profileStatus }, process.env.JWT_REFRESH_SECRET);
    bcrypt.hash(password, 10, async (err, hash) => {
        if (!err) {
            const password = await hash;
            const user = new User({ username, email, password, name, age, avatar, profileStatus, token, refreshToken });
            user.save((error) => {
                if (!error) {
                    const cleanedUser = { username, email, name, age, avatar, profileStatus}
                    res.status(200).json({
                        message: 'User created successfully',
                        user: cleanedUser,
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