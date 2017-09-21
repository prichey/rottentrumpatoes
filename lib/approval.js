const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const moment = require('moment');

const low = require('lowdb');
const approvalDb = low('./approval.json');

const fb = require('./fb');

const updateInterval = 1 * 60 * 60 * 1000; // hours * minutes * seconds * ms

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

function asyncGetApprovalRating() {
  return new Promise((resolve, reject) => {
    puppeteer
      .launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // fails in docker without this!
      })
      .then(async browser => {
        const page = await browser.newPage();
        await page.goto(
          'https://projects.fivethirtyeight.com/trump-approval-ratings/promo.html'
        );
        const content = await page.content();
        const $ = cheerio.load(content);
        browser.close();

        const approvalRating = $('.approve.end-value').find('.val').text();
        resolve(approvalRating);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncUpdateApprovalRating() {
  return new Promise((resolve, reject) => {
    return asyncGetApprovalRating()
      .then(rating => {
        const ratingObj = {
          val: rating,
          timestamp: moment()
        };

        console.log(`Updated rating: ${JSON.stringify(ratingObj)}`);
        approvalDb.set('rating', ratingObj).write();

        resolve(rating);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncUpdateApprovalRatingAndForceFbMetaScrape() {
  return new Promise((resolve, reject) => {
    asyncUpdateApprovalRating()
      .then(() => {
        return fb.asyncForceFbOgMetaScrape();
      })
      .then(() => {
        resolve();
      })
      .catch(e => {
        reject(e);
      });
  });
}

exports.init = () => {
  asyncUpdateApprovalRatingAndForceFbMetaScrape();

  const interval = setInterval(() => {
    asyncUpdateApprovalRatingAndForceFbMetaScrape().catch(err => {
      console.log(`Error updating rating and forcing rescrape: ${err}`);
    });
  }, updateInterval);
};
