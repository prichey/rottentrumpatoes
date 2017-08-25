const express = require('express');
const router = express.Router();
const low = require('lowdb');

function getConcattedMoviesArray(db) {
  const movies = [];

  for (let i = 0; i <= 100; i++) {
    const moviesWithThisRating = db
      .get(i)
      .sortBy('imdbVoteCount')
      .reverse()
      .take(20)
      .value();
    if (!!moviesWithThisRating && moviesWithThisRating.length > 0) {
      movies[i] = moviesWithThisRating;
    }
  }

  return movies;
}

router.get('/', function(req, res) {
  const moviesDb = low('./movies.json');
  const movies = getConcattedMoviesArray(moviesDb);

  res.render('movies', {
    movies: movies
  });
});

router.delete('/:movieId', function(req, res) {
  const moviesDb = low('./movies.json');

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
      moviesDb.get('excludedMovies').push(movieToRemove).write(); // add to excluded movies array
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
