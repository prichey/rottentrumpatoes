const express = require('express');
const router = express.Router();
const low = require('lowdb');
const moviesDb = low('./movies.json');

const movies = getConcattedMoviesArray();

function getConcattedMoviesArray() {
  const movies = [];

  for (let i = 0; i <= 100; i++) {
    const moviesWithThisRating = moviesDb.get(i).value();
    if (!!moviesWithThisRating && moviesWithThisRating.length > 0) {
      movies[i] = moviesWithThisRating;
    }
  }

  return movies;
}

router.get('/', function(req, res) {
  res.render('movies', {
    movies: movies
  });
});

module.exports = router;
