const express = require('express');
const router = express.Router();
const low = require('lowdb');

const approval = require('../lib/trump');

let approvalDb = low('db/approval.json');
let moviesDb = low('db/movies.json');

function getRandomMovieWithRating(rating) {
  const movies = moviesDb.get(rating).value();
  return movies[Math.floor(Math.random() * movies.length)];
}

router.get('/', function(req, res) {
  approvalDb = low('db/approval.json'); // refresh db
  moviesDb = low('db/movies.json'); // refresh db

  try {
    const ratingObj = approvalDb.get('rating').value();

    if (!!ratingObj) {
      const rating = parseInt(ratingObj.val);
      const movie = getRandomMovieWithRating(rating);
      if (!!movie) {
        res.render('index', {
          rating: rating,
          movie: movie
        });
      } else {
        res.render('500', {
          error: `couldn't find movie with rating of ${rating} :(`
        });
      }
    } else {
      res.render('500', {
        error: `couldn't find current rating :(`
      });
      // approval
      //   .asyncUpdateApprovalRating()
      //   .then(() => {
      //     // reload. this is dumb
      //     res.redirect('/');
      //   })
      //   .catch(e => {
      //     res.render('500', {
      //       error: `couldn't find current rating :(`
      //     });
      //   });
    }
  } catch (e) {
    console.log(e);
    res.render('500');
  }
});

module.exports = router;
