  window.onload = function() {

    gameloop.go_add("orders", order);
    gameloop.go_add("render", render);
    gameloop.go_add("standingsmin", standingsmin);
    gameloop.go_add("network", network);
    gameloop.go_add("audio", audio);
    gameloop.go_add("controller", controller);

    gameloop.init();
    gameloop.start();

  }
