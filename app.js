_  = require('./engine/loop');
_  = require('./engine/shared');
_  = require('./engine/network');

const bodyParser = require('body-parser');
const express  = require('express');
const app      = express();
const server   = require('./engine/main');
const Soldier  = require('./engine/soldier')
const Player   = require('./engine/player')
const compression = require('compression')
const helmet      = require('helmet')

app.use(express.static('public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

function prepareJSON() {
  return {
    ws_host : process.env.HOST,
    ws_port : process.env.EXT_WS_PORT || process.env.WS_PORT || 1337
  }
}

app.get('/play', function(req, res) {
  if (Object.keys(players).length < 2) {
    res.status(200).json( prepareJSON() );
  } else {
    res.sendStatus(502);
  }
});

app.get('/watch', function(req, res) {
   if (Object.keys(players).length === 2 && (Object.values(network.io.sockets.connected).length < 5)) {
     res.status(200).json( prepareJSON() );
   } else {
     res.sendStatus(502);
   }
});

app.get('/music', function(req, res) {
  res.sendFile('/music/' + req.param('aid') + '.mp3');
});

module.exports = app;
