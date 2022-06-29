const express = require('express');
const validator = require('validator');
const router = express.Router();
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');

router.get('/profile', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const user = storedUser.toObject();
                await delete user.password;
                await delete user.token
                await delete user.refreshToken
                res.status(200).json({
                    message: 'User found',
                    user: user
                });
            }

        }
    });
});

router.get('/profile/followers', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const followersIDs = storedUser.followers;
                let followersArray = [];
                for (const indexFollowerID of followersIDs) {
                    const indexedFollower = await User.findById(indexFollowerID);
                    const indexedFollowerClean = indexedFollower.toObject();
                    delete indexedFollowerClean.password;
                    delete indexedFollowerClean.token
                    delete indexedFollowerClean.refreshToken
                    delete indexedFollowerClean.requests
                    followersArray.push(indexedFollowerClean);
                    
                }
                res.status(200).json({
                    followers: followersArray
                });
                
            }

        }
    });
});

router.get('/profile/following', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const followingIDs = storedUser.following;
                let followingArray = [];
                for (const indexFollowingID of followingIDs) {
                    const indexedFollowing = await User.findById(indexFollowingID);
                    const indexedFollowingClean = indexedFollowing.toObject();
                    delete indexedFollowingClean.password;
                    delete indexedFollowingClean.token
                    delete indexedFollowingClean.refreshToken
                    delete indexedFollowingClean.requests
                    followingArray.push(indexedFollowingClean);
                    
                }
                res.status(200).json({
                    followers: followingArray
                });
                
            }

        }
    });
});


router.patch('/profile/requests/approve', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/profile/requests/approve/' + username);
});
router.patch('/profile/requests/approve/:username', authenticate, (req, res) => {
    const requestedUsername = req.params.username;
    const requestingUsername = req.body.username;
    if(validator.isMongoId(requestedUsername)){
        User.findOne({ username: requestingUsername }, (err, requestingUser) => {
            if(!err){
                if(!requestingUser){
                    res.status(400).json({
                        message: 'unable to locate requesting user',
                        error: err
                    });
                }else{
                    
                }
            } else{
                res.status(500).json({
                    message: 'unable to locate requesting user',
                    error: err
                });
            }
        });
    }else{

    }
});

router.delete('/profile/requests/delete', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/profile/requests/delete/' + username);
});
router.delete('/profile/requests/delete/:username', authenticate, (req, res) => {
    const requestedUsername = req.params.username;
    const requestingUsername = req.body.username;
    if(validator.isMongoId(requestedUsername)){
        User.findOne({ username: requestingUsername }, (err, requestingUser) => {
            if(!err){
                if(!requestingUser){
                    res.status(400).json({
                        message: 'unable to locate requesting user',
                        error: err
                    });
                }else{
                    
                }
            } else{
                res.status(500).json({
                    message: 'unable to locate requesting user',
                    error: err
                });
            }
        });
    }else{

    }
});

module.exports = router;