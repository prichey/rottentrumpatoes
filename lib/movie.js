require('dotenv').config();

const Promise = require('bluebird');
const low = require('lowdb');
const schedule = require('node-schedule');
const moment = require('moment');
const currentYear = parseInt(moment().format('YYYY'));

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

const moviesDb = low('db/movies.json');
moviesDb.defaults(getPlaceholderObj()).write();

function checkForMissingRatings() {
  let missing = [];

  for (let i = 0; i < 100; i++) {
    if (!(moviesDb.get(i).value().length > 0)) {
      missing.push(i);
    }
  }

  return missing;
}

function getPlaceholderObj() {
  let returnObj = { allMovies: [] };

  for (let i = 0; i <= 100; i++) {
    returnObj[i] = [];
  }

  return returnObj;
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

function asyncScrapeMovieInfo(movie) {
  return mdb('movieInfo', { id: movie.id })
    .then(res => {
      return res.imdb_id;
    })
    .then(id => {
      return Promise.delay(250).then(() => {
        return axios(omdbEndpoint + `i=${id}`);
      });
    })
    .then(res => {
      return getFormattedMovieFromObj(movie, res.data);
    })
    .then(formattedMovie => {
      console.log(
        `Adding '${formattedMovie.title}' (score: ${formattedMovie.rtScore}) to DB.`
      );
      moviesDb.get('allMovies').push(formattedMovie.movieDbId).write();
      moviesDb.get(formattedMovie.rtScore).push(formattedMovie).write();
    })
    .catch(err => {
      console.log(err.message);
    });
}

function asyncScrapeMoviesFromDiscover(config = {}, exclude = []) {
  return mdb('discoverMovie', config).then(res => {
    let promises = [];

    res.results.forEach(result => {
      if (exclude.includes(result.id) !== true) {
        promises.push(asyncScrapeMovieInfo(result));
      } else {
        // console.log(`'${result.title}' already in DB, skipping.`);
      }
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

      axios(fullUrl)
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
              new Error(`Rejecting movie from current year: ${OMDBObj.Title}`)
            );
          }
        } else {
          reject(new Error(`Invalid object: ${JSON.stringify(OMDBObj)}`));
        }
      } else {
        reject(new Error(`null score for ${OMDBObj.Title}`));
      }
    } catch (e) {
      reject(e);
    }
  });
}

function scrapeMovies(pageFrom = 1, pageTo = 1) {
  const moviesInDb = moviesDb.get('allMovies').value();

  let promises = [];
  for (let i = pageFrom; i < pageTo; i++) {
    promises.push(
      asyncScrapeMoviesFromDiscover(
        { page: i, include_adult: false, include_video: false },
        moviesInDb
      )
    );
  }

  Promise.all(promises)
    .then(() => {
      console.log('all done!');
    })
    .catch(err => {
      console.log(err.message);
    });
}

// function refreshDb() {
//   pruneDb();
//   scrapeMovies();
// }

module.exports = () => {
  scrapeMovies(400, 500);
  // const missing = checkForMissingRatings();
  // console.log('still missing: ', missing);

  // refreshDb();
  // const job = schedule.scheduleJob('0 0 6,18 * *', refreshDb);
};
