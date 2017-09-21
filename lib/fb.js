const axios = require('axios');
const Promise = require('bluebird');
const qs = require('qs');

function asyncGetFbAppAccessToken() {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/oauth/access_token?client_id=${process
      .env.FB_APP_ID}&client_secret=${process.env
      .FB_APP_SECRET}&grant_type=client_credentials`;
    axios(url)
      .then(res => {
        if (!!res && !!res.data && !!res.data.access_token) {
          // returns app access token
          resolve(res.data.access_token);
        } else {
          reject(new Error('no_access_token'));
        }
      })
      .catch(e => {
        reject(e);
      });
  });
}

function asyncMakeFbOgMetaScrapeCallWithAccessToken(access_token) {
  const data = {
    id: process.env.FB_APP_ID,
    scrape: true,
    access_token: access_token
  };

  return axios({
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify(data),
    url: 'https://graph.facebook.com'
  });
}

function asyncForceFbOgMetaScrape() {
  return new Promise((resolve, reject) => {
    asyncGetFbAppAccessToken()
      .then(access_token => {
        return asyncMakeFbOgMetaScrapeCallWithAccessToken(access_token);
      })
      .then(res => {
        if (!!res && !!res.data && !!res.data.success) {
          if (res.data.success === true) {
            resolve();
          } else {
            reject(new Error('force_scrape_unsuccessful'));
          }
        }
      })
      .catch(e => {
        reject(e);
      });
  });
}

exports.asyncForceFbOgMetaScrape = asyncForceFbOgMetaScrape;
