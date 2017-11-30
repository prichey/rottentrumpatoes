const express = require('express');
const router = express.Router();
const low = require('lowdb');

function getConcattedMoviesArrayAndTotalMovieCount(db) {
  const movies = [];
  let numMovies = 0;

  for (let i = 0; i <= 100; i++) {
    const dbMoviesWithThisRating = db
      .get(i)
      .sortBy('imdbVoteCount')
      .reverse();

    numMovies += dbMoviesWithThisRating.value().length;

    const topMoviesWithThisRating = dbMoviesWithThisRating.take(20).value();
    if (!!topMoviesWithThisRating && topMoviesWithThisRating.length > 0) {
      movies[i] = topMoviesWithThisRating;
    }
  }

  return [movies, numMovies];
}

router.get('/', function(req, res) {
  const moviesDb = low('./movies.json');
  const [movies, numMovies] = getConcattedMoviesArrayAndTotalMovieCount(
    moviesDb
  );

  res.render('movies', {
    movies: movies,
    bodyId: 'movies',
    numMovies: numMovies
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
      moviesDb
        .get('excludedMovies')
        .push(movieToRemove)
        .write(); // add to excluded movies array
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
