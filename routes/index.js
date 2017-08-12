const express = require('express');
const router = express.Router();
const dirty = require('dirty');
const db = dirty('rating.db');

db.on('load', function() {
  router.get('/', function(req, res) {
    const rating = db.get('rating');

    res.render('index', {
      rating: rating
    });
  });
});

module.exports = router;
