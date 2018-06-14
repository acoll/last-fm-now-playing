const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp(functions.config().firebase);

function getCreds(token) {
  return admin.database().ref(`/credentials/${token}`).once("value");
}

function getRecentTracks(user, apiKey) {
  return axios
    .get(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&nowplaying=true&api_key=${apiKey}&format=json`
    )
    .then(res => res.data);
}

exports.now_playing = functions.https.onRequest(function(req, res) {
  cors(req, res, () => {
    console.log("Query", req.query);

    const token = req.query.token;

    console.log("Token", token);

    if (!token) {
      res
        .status(400)
        .send(
          "You need to specify a token as a querystring param. Example: ?token=xxxxx"
        );
      return;
    }

    return getCreds(token)
      .then(snap => snap.val())
      .then(creds => {
        console.log("Creds", creds);
        if (!creds) {
          res.status(400).send("Invalid token");
          return;
        }

        return getRecentTracks(creds.user, creds.apiKey).then(result =>
          res.json(result)
        );
      })
      .catch(err => {
        console.log("Error", err);
        res.status(400).send("Something went wrong");
      });
  });
});
