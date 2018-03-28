const request = require('superagent');

let token = null;
let expires = 0;
let offsetSecs = 60;

async function getToken() {
  if (expires <= Math.round(Date.now() / 1000) + offsetSecs || !token) {
    console.log('Acquiring access token...');

    return request
      .post('https://iam.bluemix.net/identity/token')
      .type('form')
      .set('Accept', 'application/json')
      .send({ grant_type: 'urn:ibm:params:oauth:grant-type:apikey' })
      .send({ apikey: process.env.BLUEMIX_API_KEY })
      .then(resp => {
        token = resp.body.access_token;
        expires = resp.body.expiration;
        return token;
      })
      .catch(err => {
        throw err;
      });
  } else {
    return token;
  }
}

module.exports = getToken;