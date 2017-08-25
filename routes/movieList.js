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
    const movieToRemove = dbMoviesWithRating.find(movieQuery).value();

    if (movieToRemove) {
      console.log(`Removing '${movieToRemove.title}'`);
      dbMoviesWithRating.remove(movieQuery).write(); // remove from ratings section
      moviesDb.get('allMovies').remove(movieQuery).write(); // remove from allMovies

      moviesDb.get('excludedMovies').push(movieId).write(); // add to excluded movies array

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
