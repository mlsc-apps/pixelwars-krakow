const wps_api  = require('./wps-api');
const clock = require('./clock');
const controller = require('./controller')
const aiplayer1 = require('./ai-player-one');
const aiplayer2 = require('./ai-player-two');

module.exports = {

  start : function() {
      gameloop.go_add("network", network);
      gameloop.go_add("wps-api", wps_api);
      gameloop.go_add("clock", clock);
      gameloop.go_add("controller", controller);
      if (process.env.MODE && process.env.MODE === "auto") gameloop.go_add("ai-player-one", aiplayer1);
      gameloop.go_add("ai-player-two", aiplayer2);

      gameloop.init();
      setInterval(gameloop.update.bind(gameloop), 30);
      console.log(new Date() + ': game loop started')
  }

}
