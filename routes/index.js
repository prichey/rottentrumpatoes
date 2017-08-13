const express = require('express');
const router = express.Router();
const low = require('lowdb');
const approvalDb = low('db/approval.json');
const movieDb = low('db/movies.json');

const rating = parseInt(approvalDb.get('rating').value().val);

function getRandomMovieWithRating(rating) {
  const movies = movieDb.get(rating).value();
  return movies[Math.floor(Math.random() * movies.length)];
}

router.get('/', function(req, res) {
  const movie = getRandomMovieWithRating(rating);

  res.render('index', {
    rating: rating,
    movie: movie
  });
});

module.exports = router;
