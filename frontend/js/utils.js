
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function show_loading(show) {
  document.getElementById('loading').style.display   = show ? "block" : "none";
}

function set_checkbox(ename, value) {
    document.getElementById(ename).checked = value;
}

function highlight_button(ename, value) {
    document.getElementById(ename).style.color = value ? "blue" : "#aaa";
}

function set_checkbox_cookie(cname, ename, callback) {
  let cookie = getCookie(cname);
  if (cookie != "") {
    // if (document.getElementById(ename).checked !== (cookie === "true")) {
      callback(cookie === "true");
    // }
  }
}

function add_chat_message(msg) {
  if (!chats[msg.from]) chats[msg.from] = [];
  chats[msg.from].push("him:" + msg.text);
  let showing = document.getElementById('chat-modal').style.display === "inline-block";
  if (!showing || (showing && chat_pid_opened !== msg.from)) {
    players[msg.from].new_mail = true;
  } else {
    openchat_pid = msg.from;
  }
}

function init_checkboxes() {
  set_checkbox_cookie('urgrid', 'grid_checkbox', render.toggle_grid);
  set_checkbox_cookie('ursound', 'sound_checkbox', render.toggle_sound);
  set_checkbox_cookie('urmusic', 'music_checkbox', render.toggle_music);
}

function open_link(name) {
  document.getElementById(name).click();
}

function on_key_modal(ename) {
  let link = document.getElementById(ename).style.display === 'inline-block' ? ename + '-c' : ename + '-o';
  open_link(link);
}

function show_info(message) {
  document.getElementById("info-modal").innerHTML = message;
  open_link("info-modal-o");
}

function show_connection_lost() {
  show_info("Connection to server lost...<br>Refresh the page to play again");
}

$('a[href="#standings-modal"]').click(function(event) {
event.preventDefault();
$(this).modal({
  escapeClose: false,
  clickClose: false,
  showClose: true,
  autoManaged: false,
  autoBlock: false,
  name: "standings"
});
});

$('a[href="#chat-modal"]').click(function(event) {
event.preventDefault();
$(this).modal({
  escapeClose: false,
  clickClose: false,
  showClose: true,
  autoManaged: false,
  autoBlock: false,
  name: "chat"
});
});

$('a[href="#info-modal"]').click(function(event) {
event.preventDefault();
$(this).modal({
  escapeClose: true,
  clickClose: true,
  showClose: true
});
});

function openFullscreen(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }

}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
}

function add_touch_listeners(){
  document.getElementById('grid_button').addEventListener('touchstart', (e) => {
    render.toggle_grid();
  });
  document.getElementById('howtoplay_button').addEventListener('touchstart', (e) => {
  show_info(`
    <table class="howtoplay">
          <tr><td>One-finger touch</td><td>Move soldiers</td></tr>
          <tr><td>Two-finger touch move</td><td>Move camera</td></tr>
          <tr><td>Two-finger pinch</td><td>Zoom in/out</td></tr>
          <tr><td>Tap unit</td><td>Launch missile</td></tr>
          <tr><td>When you see this sign <img src='icons/airsupport.png' width=19px height=19px /></td></tr>
          <tr><td>Tap and hold unit for 3 sec</td><td>Call air support</td></tr>
    </table>
        <p>Contact:<br>
        <a href="mailto:contact@pixel-wars.com" style="color: #0066ff">contact@pixel-wars.com</a><br>
        <p>Music:<br>
        soundcloud.com/sergenarcissoff<br>
        bensound.com<br>
        purple-planet.com<br>
        <p>Sounds:<br>
        zapsplat.com`) });
  document.getElementById('music_button').addEventListener('touchstart', (e) => {
    audio.track.play();
    render.toggle_music();
    render.toggle_sound();
  });
}

init_checkboxes();
add_touch_listeners();
// open_link('standings-modal-c');
