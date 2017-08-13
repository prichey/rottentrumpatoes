const express = require('express');
const router = express.Router();
const low = require('lowdb');
const io = require('./../app').io;

// require('../lib/movie')();
const scrapeMovies = require('../lib/movie.js').scrapeMovies;

router.get('*', function(req, res) {
  try {
    const [, pageFrom, pageTo] = req.params[0].trim('/').split('/');
    if (!!pageFrom && !!pageTo && pageTo >= pageFrom) {
      res.render('scrape', {
        pageFrom: pageFrom,
        pageTo: pageTo
      });

      const socket = io.sockets.in('foo');
      scrapeMovies(pageFrom, pageTo, socket);
    } else {
      res.redirect('/');
    }
  } catch (e) {
    res.redirect('/');
  }
});

module.exports = router;
