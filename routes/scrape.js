const express = require('express');
const router = express.Router();
const low = require('lowdb');
const io = require('./../app').io;

const puppeteer = require('puppeteer');

// require('../lib/movie')();
const asyncScrapeMovies = require('../lib/movie.js').asyncScrapeMovies;

router.get('*', function(req, res) {
  try {
    const [, pageFrom, pageTo] = req.params[0].trim('/').split('/');
    if (!!pageFrom && !!pageTo && pageTo >= pageFrom) {
      res.render('scrape', {
        pageFrom: pageFrom,
        pageTo: pageTo
      });

      const socket = io.sockets.in('foo');
      try {
        asyncScrapeMovies(pageFrom, pageTo, socket).catch(err => {
          console.log(err.message);
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      res.redirect('/');
    }
  } catch (e) {
    res.redirect('/');
  }
});

module.exports = router;
