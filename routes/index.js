const express = require('express');
const router = express.Router();
const low = require('lowdb');
const approvalDb = low('db/approval.json');
const moviesDb = low('db/movies.json');

function getRandomMovieWithRating(rating) {
  const movies = moviesDb.get(rating).value();
  return movies[Math.floor(Math.random() * movies.length)];
}

router.get('/', function(req, res) {
  const ratingObj = approvalDb.get('rating').value();
  const rating = parseInt(ratingObj.val);
  const movie = getRandomMovieWithRating(rating);

  res.render('index', {
    rating: rating,
    movie: movie
  });
});

module.exports = router;
