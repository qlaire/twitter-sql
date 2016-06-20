'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db/');

module.exports = function makeRouterWithSockets(io) {

    // a reusable function
    function respondWithAllTweets(req, res, next) {
        client.query('SELECT content, name, tweets.id FROM tweets JOIN users ON tweets.userid = users.id', function(err, data) {
            // console.log("data.rows: ", data.rows);
            res.render('index', {
                title: 'Twitter.js',
                tweets: data.rows,
                showForm: true
            });
        });

    }

    // here we basically treet the root view and tweets view as identical
    router.get('/', respondWithAllTweets);
    router.get('/tweets', respondWithAllTweets);

    // single-user page
    router.get('/users/:username', function(req, res, next) {
        client.query('SELECT content, name, tweets.id FROM tweets JOIN users ON tweets.userid = users.id WHERE name=$1', [req.params.username], function(err, data) {
            // console.log("data:", data);
            res.render('index', {
                title: 'Twitter.js',
                tweets: data.rows,
                showForm: true
            });
        });
    });

    // single-tweet page
    router.get('/tweets/:id', function(req, res, next) {
        client.query('SELECT content, name, tweets.id FROM tweets JOIN users ON tweets.userid = users.id WHERE tweets.id=$1', [req.params.id], function(err, data) {
            // console.log("data:", data);
            res.render('index', {
                title: 'Twitter.js',
                tweets: data.rows,
                showForm: true
            });
        });
    });

    // create a new tweet
    router.post('/tweets', function(req, res, next) {
        /*Check if user already exists*/
        client.query('SELECT name FROM users', function(err, data) {
            if (err) {
                console.error(err);
            }
            console.log("data.rows :", data.rows);
            var isThereAlready = false;
            for (var i = 0; i < data.rows.length; i++) {
                if (data.rows[i].name === req.body.name) {
                    isThereAlready = true;
                }
            }
            console.log("isThereAlready: ", isThereAlready);

            /*If not, add it to the user table.*/
            if (!isThereAlready) {
                client.query('INSERT INTO users (name, pictureurl) VALUES($1, \'http://i.imgur.com/I8WtzSw.jpg\') RETURNING *', [req.body.name], function(err, data) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("It worked! data.rows: ", data.rows);
                        client.query('INSERT INTO tweets (userid, content) VALUES($1, $2)', [data.rows[0].id, req.body.content], function(err, data) {
                            res.redirect('/');
                        });
                    }
                });
            } else {
                client.query('SELECT userid FROM tweets JOIN users on tweets.userid = users.id WHERE name=$1', [req.body.name], function(err, data) {
                    if (err) {
                        console.error(err);
                    }
                    client.query('INSERT INTO tweets (userid, content) VALUES($1,$2) RETURNING *', [data.rows[0].userid, req.body.content], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        // console.log("data:", data);
                        res.redirect('/');
                    });
                });
            }
        });
    });

    // var newTweet = tweetBank.add(req.body.name, req.body.content);
    // io.sockets.emit('new_tweet', newTweet);

    // // replaced this hard-coded route with general static routing in app.js
    // router.get('/stylesheets/style.css', function(req, res, next){
    //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
    // });

    return router;
};
