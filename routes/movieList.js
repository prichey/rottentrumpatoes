const express = require('express');
const router = express.Router();
const low = require('lowdb');
const moviesDb = low('./movies.json');

const movies = getConcattedMoviesArray();

function sortMoviesByVoteCount(movies) {
  return movies;
}

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

router.delete('/:movieId', function(req, res) {
  if (!!req.query.rating && req.params.movieId) {
    const dbMoviesWithRating = moviesDb.get(req.query.rating);
    const movieId = parseInt(req.params.movieId);
    const movieQuery = {
      movieDbId: movieId
    };

    if (dbMoviesWithRating.find(movieQuery).value()) {
      // delete from db
      dbMoviesWithRating.remove(movieQuery).write();

      // add to excluded movies array
      moviesDb.get('excludedMovies').push(movieId).write();

      res.sendStatus(200);
    } else {
      // not found in db
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(500);
  }
});

module.exports = router;
