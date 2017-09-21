require('dotenv').config();

const Promise = require('bluebird');
const low = require('lowdb');
const moment = require('moment');
const urlencode = require('urlencode');

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const range = require('range').range;

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

function asyncGetRottenTomatoesUrlFromMovieObj(movieObj, page) {
  return new Promise(async (resolve, reject) => {
    const randomDelay = Math.random() * 30000 + 30000; // introduce random delay because I think I'm getting throttled by RT
    const message = `Delaying ${randomDelay /
      1000} seconds before getting '${movieObj.title}' on RT.`;
    socket.emit('new_msg', { msg: message });
    console.log(message);
    await Promise.delay(randomDelay);

    console.log(`Getting '${movieObj.title}' on RT`);
    await page.goto(
      `https://www.rottentomatoes.com/search/?search=${urlencode(
        movieObj.title
      )}`
    );
    const content = await page.content();
    const $ = cheerio.load(content);

    const $movies = $('#movieSection .results_ul li .details');
    for (let i = 0; i < $movies.length; i++) {
      const $movie = $($movies[i]);
      const yearWithParens = $movie.find('.movie_year').text();
      const year = yearWithParens.replace(/\D/g, '');
      if (year == movieObj.year) {
        const link = $movie.find('.articleLink').attr('href');
        movieObj.rtUrl = `https://www.rottentomatoes.com${link}`;
        resolve(movieObj);
      }
    }

    reject(new Error(`'${movieObj.title}' has no RT url, ignoring.`));
  });
}

async function asyncOpenBrowserAndScrapeMovieInfo(result, socket, browser) {
  return new Promise((resolve, reject) => {
    browser
      .newPage()
      .then(page => {
        asyncScrapeMovieInfo(result, socket, page)
          .then(() => {
            try {
              page.close();
            } catch (e) {
              console.log(e);
            }
            resolve();
          })
          .catch(err => {
            try {
              page.close();
            } catch (e) {
              console.log(e);
            }
            reject(err);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncScrapeMovieInfo(movie, socket = null, page) {
  return new Promise((resolve, reject) => {
    mdb('movieInfo', { id: movie.id })
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
      .then(formattedMovieWithoutRtUrl => {
        return asyncGetRottenTomatoesUrlFromMovieObj(
          formattedMovieWithoutRtUrl,
          page
        );
      })
      .then(formattedMovie => {
        const message = `Adding '${formattedMovie.title}' (score: ${formattedMovie.rtScore}) to DB.`;
        socket.emit('new_msg', { msg: message });
        console.log(message);

        moviesDb.get(formattedMovie.rtScore).push(formattedMovie).write();
        resolve();
      })
      .catch(err => {
        socket.emit('new_msg', { msg: err.message });
        console.log(err.message);
        reject(err);
        // resolve();
      });
  });
}

async function asyncScrapeMoviesFromDiscover(
  config = {},
  moviesInDb = [],
  moviesToExclude = [],
  socket = null,
  browser
) {
  return new Promise((resolve, reject) => {
    mdb('discoverMovie', config)
      .then(async res => {
        const promises = [];

        for (let result of res.results) {
          let message = '';
          let needToFetch = false;

          if (moviesInDb.includes(result.id) === true) {
            message = `'${result.title}' already in DB, skipping.`;
          } else if (moviesToExclude.includes(result.id) === true) {
            message = `'${result.title}' on blacklist, skipping.`;
          } else {
            needToFetch = true;
          }

          if (needToFetch) {
            try {
              await asyncOpenBrowserAndScrapeMovieInfo(result, socket, browser);
            } catch (e) {
              // console.log(e);
            }
          } else {
            socket.emit('new_msg', { msg: message });
            console.log(message);
          }
        }

        resolve();

        // res.results.forEach((result, i) => {
        //   let message = '';
        //   let needToFetch = false;
        //
        //   if (moviesInDb.includes(result.id) === true) {
        //     message = `'${result.title}' already in DB, skipping.`;
        //   } else if (moviesToExclude.includes(result.id) === true) {
        //     message = `'${result.title}' on blacklist, skipping.`;
        //   } else {
        //     message = `Adding promise for '${result.title}'.`;
        //     needToFetch = true;
        //   }
        //
        //   socket.emit('new_msg', { msg: message });
        //   console.log(message);
        //
        //   if (needToFetch) {
        //     console.log(`pre ${result.title}`);
        //     // promises.push(
        //     //   asyncOpenBrowserAndScrapeMovieInfo(result, socket, browser)
        //     // );
        //     try {
        //       await asyncOpenBrowserAndScrapeMovieInfo(result, socket, browser);
        //     } catch (e) {
        //       // console.log(e);
        //     }
        //   }
        // });

        // Promise.all(promises)
        //   .then(() => {
        //     resolve();
        //   })
        //   .catch(err => {
        //     console.log(err);
        //     resolve();
        //   });
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
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

function asyncScrapeMovies(pageFromStr = 1, pageToStr = 1, socket = null) {
  return new Promise((resolve, reject) => {
    const moviesInDb = getAllMoviesIdsInDb();
    const moviesToExclude = moviesDb.get('excludedMovies').value();

    const pageFrom = parseInt(pageFromStr);
    const pageTo = parseInt(pageToStr) + 1; // include page to

    puppeteer
      .launch()
      .then(async browser => {
        const pageRange = range(pageFrom, pageTo);
        for (let i in pageRange) {
          const pageNum = pageFrom + parseInt(i);

          try {
            const message = `Starting page ${pageNum}`;
            socket.emit('new_msg', { msg: message });
            console.log(message);

            await asyncScrapeMoviesFromDiscover(
              { page: pageNum, include_adult: false, include_video: false },
              moviesInDb,
              moviesToExclude,
              socket,
              browser
            );
          } catch (e) {
            console.log(e);
          }
        }

        const message = 'All done!';
        socket.emit('new_msg', { msg: message });
        console.log(message);

        try {
          browser.close();
        } catch (e) {
          console.log(e);
        }

        resolve();

        // for (let i = pageFrom; i < pageTo; i++) {
        //   promises.push(
        //     asyncScrapeMoviesFromDiscover(
        //       { page: i, include_adult: false, include_video: false },
        //       moviesInDb,
        //       moviesToExclude,
        //       socket,
        //       browser
        //     )
        //   );
        // }

        // Promise.all(promises)
        //   .then(() => {
        //     const message = 'All done!';
        //     socket.emit('new_msg', { msg: message });
        //     console.log(message);
        //     browser.close();
        //     resolve();
        //   })
        //   .catch(err => {
        //     browser.close();
        //     reject(err);
        //   });
      })
      .catch(err => {
        reject(err);
      });
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

function addLowerQualityImageUrlToEveryMovieInDb() {
  for (let i = 0; i <= 100; i++) {
    const dbMoviesWithThisRating = moviesDb.get(i);
    const moviesWithThisRating = dbMoviesWithThisRating.value();
    for (let i in moviesWithThisRating) {
      const thisMovie = moviesWithThisRating[i];
      const fullPosterUrl = thisMovie.posterUrl;
      const fullPosterUrlWithoutJpg = fullPosterUrl.replace('.jpg', '');
      const downsizedPosterUrl = `${fullPosterUrlWithoutJpg}._V1_SX800.jpg`;
      dbMoviesWithThisRating
        .find({ imdbId: thisMovie.imdbId })
        .assign({
          posterUrl: downsizedPosterUrl,
          fullPosterUrl: fullPosterUrl
        })
        .write();
      // console.log(`${thisMovie.title} done`);
    }
    console.log(`${i}% done`);
  }
  console.log('All done');
}

exports.asyncScrapeMovies = asyncScrapeMovies;
