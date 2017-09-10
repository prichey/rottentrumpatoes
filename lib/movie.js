require('dotenv').config();

const Promise = require('bluebird');
const low = require('lowdb');
const moment = require('moment');
const currentYear = parseInt(moment().format('YYYY'));

const requestTimeout = 10 * 1000; // ms

// promisify mdb
const _mdb = require('moviedb')(process.env.MOVIEDB_API_KEY);
const limits = require('limits.js');
const throttle = limits().within(1000, 3);
const mdb = (m, q) =>
  new Promise((res, rej) => {
    throttle.push(() =>
      _mdb[m](q, (err, data) => (err ? rej(err) : res(data)))
    );
  });

const axios = require('axios');
const omdbEndpoint = `http://www.omdbapi.com/?apikey=${process.env
  .OMDB_API_KEY}&`;

const moviesDb = low('./movies.json');

function checkForMissingRatings() {
  let missing = [];

  for (let i = 0; i <= 100; i++) {
    if (!(moviesDb.get(i).value().length > 0)) {
      missing.push(i);
    }
  }

  return missing;
}

function pruneDb() {
  for (let i = 1; i <= 100; i++) {
    // go through each db entry and make sure it is still up to date. if not, update
  }
}

function getRTScoreObjFromRatingsArray(ratings) {
  if (!!ratings && ratings.length > 0) {
    for (let i = 0; i < ratings.length; i++) {
      let rating = ratings[i];
      if (rating.Source === 'Rotten Tomatoes') {
        return parseInt(rating.Value);
      }
    }
  }

  return null;
}

function asyncScrapeMovieInfo(movie, socket = null) {
  return mdb('movieInfo', { id: movie.id })
    .then(res => {
      return res.imdb_id;
    })
    .then(id => {
      return Promise.delay(250).then(() => {
        return axios({
          url: omdbEndpoint + `i=${id}`,
          timeout: requestTimeout
        });
      });
    })
    .then(res => {
      return getFormattedMovieFromObj(movie, res.data);
    })
    .then(formattedMovie => {
      const message = `Adding '${formattedMovie.title}' (score: ${formattedMovie.rtScore}) to DB.`;
      socket.emit('new_msg', { msg: message });
      console.log(message);

      moviesDb.get(formattedMovie.rtScore).push(formattedMovie).write();
    })
    .catch(err => {
      socket.emit('new_msg', { msg: err.message });
      console.log(err.message);
    });
}

function asyncScrapeMoviesFromDiscover(
  config = {},
  moviesInDb = [],
  moviesToExclude = [],
  socket = null
) {
  return mdb('discoverMovie', config).then(res => {
    let promises = [];

    res.results.forEach(result => {
      let message = '';

      if (moviesInDb.includes(result.id) === true) {
        message = `'${result.title}' already in DB, skipping.`;
      } else if (moviesToExclude.includes(result.id) === true) {
        message = `'${result.title}' on blacklist, skipping.`;
      } else {
        message = `Adding promise for '${result.title}'.`;
        promises.push(asyncScrapeMovieInfo(result, socket));
      }

      socket.emit('new_msg', { msg: message });
      console.log(message);
    });

    return Promise.all(promises);
  });
}

function asyncGetPosterUrl(url) {
  return new Promise((resolve, reject) => {
    // see if we can figure out the full version of the image
    const split = url.split('._V1_SX300');

    if (split.length > 1) {
      const fullUrl = split.join('');

      axios({
        url: fullUrl,
        timeout: requestTimeout
      })
        .then(res => {
          resolve(fullUrl);
        })
        .catch(err => {
          resolve(url);
        });
    } else {
      resolve(url);
    }
  });
}

function fullMovieObj(obj) {
  if ('Title' in obj === false) return false;
  if ('imdbID' in obj === false) return false;
  if ('imdbRating' in obj === false) return false;
  if ('imdbVotes' in obj === false) return false;
  if ('Poster' in obj === false) return false;
  if ('Year' in obj === false) return false;

  return true;
}

function getFormattedMovieFromObj(movieDbObj, OMDBObj) {
  console.log(OMDBObj);
  return new Promise((resolve, reject) => {
    try {
      const rtScore = getRTScoreObjFromRatingsArray(OMDBObj.Ratings);

      // exclude movies without a score
      if (rtScore !== null) {
        // exclude malformed movie objects
        if (fullMovieObj(OMDBObj)) {
          // exclude movies from current year, as rating might change
          if (parseInt(OMDBObj.Year) !== currentYear) {
            asyncGetPosterUrl(OMDBObj.Poster)
              .then(posterUrl => {
                resolve({
                  title: OMDBObj.Title,
                  imdbId: OMDBObj.imdbID,
                  movieDbId: movieDbObj.id,
                  rtScore: rtScore,
                  imdbScore: parseFloat(OMDBObj.imdbRating),
                  imdbVoteCount: parseInt(OMDBObj.imdbVotes),
                  posterUrl: posterUrl,
                  timestamp: moment(),
                  year: parseInt(OMDBObj.Year)
                });
              })
              .catch(err => {
                resolve({
                  title: OMDBObj.Title,
                  imdbId: OMDBObj.imdbID,
                  movieDbId: movieDbObj.id,
                  rtScore: rtScore,
                  imdbScore: parseFloat(OMDBObj.imdbRating),
                  imdbVoteCount: parseInt(OMDBObj.imdbVotes),
                  posterUrl: OMDBObj.Poster,
                  timestamp: moment(),
                  year: parseInt(OMDBObj.Year)
                });
              });
          } else {
            reject(
              new Error(
                `Rejecting movie from current year: '${OMDBObj.Title}'.`
              )
            );
          }
        } else {
          reject(new Error(`Invalid object: ${JSON.stringify(OMDBObj)}`));
        }
      } else {
        reject(new Error(`null score for '${OMDBObj.Title}'.`));
      }
    } catch (e) {
      reject(e);
    }
  });
}

function scrapeMovies(pageFrom = 1, pageTo = 1, socket = null) {
  const moviesInDb = getAllMoviesIdsInDb();
  const moviesToExclude = moviesDb.get('excludedMovies').value();

  let promises = [];
  for (let i = pageFrom; i < pageTo; i++) {
    promises.push(
      asyncScrapeMoviesFromDiscover(
        { page: i, include_adult: false, include_video: false },
        moviesInDb,
        moviesToExclude,
        socket
      )
    );
  }

  Promise.all(promises)
    .then(() => {
      const message = 'All done!';
      socket.emit('new_msg', { msg: message });
      console.log(message);
    })
    .catch(err => {
      console.log(err.message);
    });
}

function getAllMoviesIdsInDb() {
  const movieIds = [];

  for (let i = 0; i <= 100; i++) {
    const moviesWithThisRating = moviesDb
      .get(i)
      .sortBy('imdbVoteCount')
      .reverse()
      .value();

    if (!!moviesWithThisRating && moviesWithThisRating.length > 0) {
      for (let j = 0; j < moviesWithThisRating.length; j++) {
        const movie = moviesWithThisRating[j];
        movieIds.push(movie.movieDbId);
      }
    }
  }

  return movieIds;
}

exports.scrapeMovies = scrapeMovies;
