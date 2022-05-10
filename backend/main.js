const wpsApi  = require('./wps-api');
const clock = require('./clock');
const controller = require('./controller')
const aiplayer1 = require('./ai-player-one');
const aiplayer2 = require('./ai-player-two');

module.exports = {

  start : function() {
      gameLoop.goAdd("network", network);
      gameLoop.goAdd("wps-api", wpsApi);
      gameLoop.goAdd("clock", clock);
      gameLoop.goAdd("controller", controller);
      if (process.env.MODE && process.env.MODE === "auto") gameLoop.goAdd("ai-player-one", aiplayer1);
      gameLoop.goAdd("ai-player-two", aiplayer2);

      gameLoop.init();
      setInterval(gameLoop.update.bind(gameLoop), 30);
      console.log(new Date() + ': game loop started')
  }

}
