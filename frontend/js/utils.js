
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

function showLoading(show) {
  document.getElementById('loading').style.display   = show ? "block" : "none";
}

function setCheckbox(ename, value) {
    document.getElementById(ename).checked = value;
}

function highlightButton(ename, value) {
    document.getElementById(ename).style.color = value ? "blue" : "#aaa";
}

function setCheckboxCookie(cname, ename, callback) {
  let cookie = getCookie(cname);
  if (cookie != "") {
    // if (document.getElementById(ename).checked !== (cookie === "true")) {
      callback(cookie === "true");
    // }
  }
}

function addChatMessage(msg) {
  if (!chats[msg.from]) chats[msg.from] = [];
  chats[msg.from].push("him:" + msg.text);
  let showing = document.getElementById('chat-modal').style.display === "inline-block";
  if (!showing || (showing && chatPidOpened !== msg.from)) {
    players[msg.from].newMail = true;
  } else {
    openchatPid = msg.from;
  }
}

function initCheckboxes() {
  setCheckBoxCookie('urgrid',  'grid_checkbox',  render.toggleGrid);
  setCheckBoxCookie('ursound', 'sound_checkbox', render.toggleSound);
  setCheckBoxCookie('urmusic', 'music_checkbox', render.toggleMusic);
}

function openLink(name) {
  document.getElementById(name).click();
}

function onKeyModal(ename) {
  let link = document.getElementById(ename).style.display === 'inline-block' ? ename + '-c' : ename + '-o';
  openLink(link);
}

function showInfo(message) {
  document.getElementById("info-modal").innerHTML = message;
  openLink("info-modal-o");
}

function showConnectionLost() {
  showInfo("Connection to server lost...<br>Refresh the page to play again");
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

function addTouchListeners(){
  document.getElementById('grid_button').addEventListener('touchstart', (e) => {
    render.toggleGrid();
  });
  document.getElementById('howtoplay_button').addEventListener('touchstart', (e) => {
  showInfo(`
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
    render.toggleMusic();
    render.toggleSound();
  });
}

initCheckboxes();
addTouchListeners();
