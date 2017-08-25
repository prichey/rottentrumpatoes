const express = require('express');
const router = express.Router();
const low = require('lowdb');

const approval = require('../lib/approval');

const approvalDbPath = './tmp/approval.json';
const moviesDbPath = './movies.json';

let approvalDb = low(approvalDbPath);
let moviesDb = low(moviesDbPath);

function getRandomMovieWithRating(rating) {
  const movies = moviesDb.get(rating).value();
  return movies[Math.floor(Math.random() * movies.length)];
}

router.get('/', function(req, res) {
  // refresh dbs
  approvalDb = low(approvalDbPath);
  moviesDb = low(moviesDbPath);

  try {
    const ratingObj = approvalDb.get('rating').value();

    if (!!ratingObj) {
      const rating = parseInt(ratingObj.val);
      const movie = getRandomMovieWithRating(rating);
      if (!!movie) {
        res.render('index', {
          rating: rating,
          movie: movie
        });
      } else {
        res.render('500', {
          error: `couldn't find movie with rating of ${rating} :(`
        });
      }
    } else {
      res.render('500', {
        error: `couldn't find current rating :(`
      });
    }
  } catch (e) {
    console.log(e);
    res.render('500');
  }
});

module.exports = router;
