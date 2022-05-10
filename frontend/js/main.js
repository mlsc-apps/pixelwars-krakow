  window.onload = function() {

    gameLoop.goAdd("orders", order);
    gameLoop.goAdd("render", render);
    gameLoop.goAdd("standingsmin", standingsmin);
    gameLoop.goAdd("network", network);
    gameLoop.goAdd("audio", audio);
    gameLoop.goAdd("controller", controller);

    gameLoop.init();
    gameLoop.start();

  }
