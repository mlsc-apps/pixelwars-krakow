function inoflag(img) {
  let ploadfailed = players[img.id];
  standingsmin.p[ploadfailed.roomid].c.innerHTML = ploadfailed.country;
}

let standingsmin = {

  table : null,
  wait  : 0,
  timecell : null,

  init : function() {
    this.table = document.getElementById("standingsmintable");
    // row = this.table.insertRow(0);
    this.timecell = document.getElementById('standingsmin-time');
    this.p = {};
    this.p[0]   = document.getElementById('standingsmin-p1');
    this.p[0].c = document.getElementById('standingsmin-p1c');
    this.p[0].p = document.getElementById('standingsmin-p1p');
    this.p[0].air = document.getElementById('standingsmin-p1air');
    this.p[1]     = document.getElementById('standingsmin-p2');
    this.p[1].c   = document.getElementById('standingsmin-p2c');
    this.p[1].p   = document.getElementById('standingsmin-p2p');
    this.p[1].air = document.getElementById('standingsmin-p2air');
  },

  update : function(dt) {
    if (toGo !== null) this.timecell.innerHTML = ~~(toGo / 60) + ":" + ((toGo % 60) < 10 ? "0" + (toGo % 60) : (toGo % 60));
    let pp = Object.values(players);
    for (i=0; i < pp.length; i++) {
         let p = pp[i];
         if (this.p[p.roomid].innerHTML === '') {
           this.p[p.roomid].innerHTML = p.nick;
           let bordercolor = `solid #${p.color.getHexString()}`;
           if (p.roomid === 0) this.table.rows[0].cells[0].style.borderLeft = "3px " + bordercolor;
           if (p.roomid === 1) this.table.rows[0].cells[8].style.borderRight = "3px " + bordercolor;
         }
         if (this.p[p.roomid].c.innerHTML === '') this.p[p.roomid].c.innerHTML = "<img id='" + p.id + "' src='https://flagcdn.com/w40/" + p.country.toLowerCase() + ".png' width=25px height=19px onerror='inoflag(this);'>";

       if (sUpdatesFromServer[clickTick]) {
         p.population = sUpdatesFromServer[clickTick][i];
       }
       this.p[p.roomid].p.innerHTML = p.population;

       if (pp.length === 2) {
         let opponentPop = i === 0 ? pp[1].population : pp[0].population;
         let opponentGap = opponentPop * 0.1;
         p.airStrikeReady = (opponentPop - p.population) > opponentGap && p.population > 500;
         this.p[p.roomid].air.innerHTML = (p.airStrikeReady && !p.sentPlanes) ? "<img src='icons/airsupport.png' width=19px height=19px />" : ' ';
       }
    }

  }
}
