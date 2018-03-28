require('dotenv').config();
const express = require('express');
const request = require('superagent');
const getToken = require('./tokens');

const maps = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise: require('q').Promise
});

let env = process.env.NODE_ENV || 'development';
console.log(`Environment: ${env}`);

if (env === 'development') {
  process.env.PORT = 3000;
}

let app = express();
app.use(express.static('public'));

app.get('/api/attractions', (req, res) => {
  if (!req.query.address) {
    return res.status(400).send({
      error: 'Missing address parameter'
    });
  }

  maps
    .geocode({ address: req.query.address })
    .asPromise()
    .then(async (response) => {
      if (!response.json.results.length) {
        return res.status(400).send({ error: 'Unable to determine coordinates' });
      }

      let coords = response.json.results[0].geometry.location;

      try {
        let token = await getToken();

        request
          .get(`${process.env.BLUEMIX_URL}/travel/v1/attractions`)
          .set('Authorization', `Bearer ${token}`)
          .set('Instance-ID', process.env.BLUEMIX_INSTANCE_ID)
          .set('Accept', 'application/json')
          .query({ location: `${coords.lat},${coords.lng}` })
          .end((err, resp) => {
            if (err) {
              console.log(err);
              return res.status(500).send({ error: 'Something went wrong' });
            }

            res.send(resp.body.results);
          });
      } catch (err) {
        console.log(err);
        return res.status(500).send({ error: 'Something went wrong' });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({ error: 'Something went wrong' });
    });
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}...`);
});
