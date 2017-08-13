const axios = require('axios');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const moment = require('moment');
const schedule = require('node-schedule');

const low = require('lowdb');
const approvalDb = low('db/approval.json');
approvalDb.defaults({}).write();

const ratingUrl =
  'https://www.realclearpolitics.com/epolls/other/president_trump_job_approval-6179.html';

function asyncGetAvgRatingFromHtml(html) {
  return new Promise((resolve, reject) => {
    try {
      const $ = cheerio.load(html);
      const rating = $('.rcpAvg td').eq(3).text();
      resolve(rating);
    } catch (e) {
      reject(e);
    }
  });
}

function asyncUpdateApprovalRating() {
  return new Promise((resolve, reject) => {
    return axios(ratingUrl)
      .then(resp => {
        return asyncGetAvgRatingFromHtml(resp.data);
      })
      .then(rating => {
        const ratingObj = {
          val: rating,
          timestamp: moment()
        };

        console.log(`Updated rating: ${JSON.stringify(ratingObj)}`);
        approvalDb.set('rating', ratingObj).write();

        return rating;
      });
  });
}

module.exports = () => {
  asyncUpdateApprovalRating();

  // update at midnight and noon
  const job = schedule.scheduleJob('0 0 0,12 * *', asyncUpdateApprovalRating);
};
