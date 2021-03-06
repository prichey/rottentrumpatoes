const express = require('express');
const router = express.Router();
const low = require('lowdb');
const moment = require('moment');

const approval = require('../lib/approval');

const approvalDbPath = './approval.json';
const moviesDbPath = './movies.json';

let approvalDb = low(approvalDbPath);
let moviesDb = low(moviesDbPath);

function getRandomMovieWithRating(rating) {
  const movies = moviesDb
    .get(rating)
    .sortBy('imdbVoteCount')
    .reverse()
    .take(20)
    .value();
  return movies[Math.floor(Math.random() * movies.length)];
}

router.get('/', function(req, res) {
  // refresh dbs
  approvalDb = low(approvalDbPath);
  moviesDb = low(moviesDbPath);

  try {
    const ratingObj = approvalDb.get('rating').value();

    if (!!ratingObj) {
      const rating = ratingObj.val;
      const movie = getRandomMovieWithRating(parseInt(rating));
      if (!!movie) {
        res.render('index', {
          rating: rating,
          ratingDate: moment(ratingObj.timestamp).format('LT l'),
          movie: movie,
          bodyId: 'index'
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
