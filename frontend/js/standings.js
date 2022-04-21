let game_ended = false;

function inoflag(img) {
  let p = players[img.id];
  document.getElementById('c' + p.id).innerHTML = p.country;
}

let standings = {

  table : null,
  wait  : 0,
  timecell : null,

  init : function() {
    this.table = document.getElementById("dynamic-list");
    row = this.table.insertRow(0);
    let cell0 = row.insertCell(0);
    this.timecell = row.insertCell(1);
    cell0.innerHTML = "Time left: <br>";
  },

  update : function(dt) {
    if (to_go !== null) this.timecell.innerHTML = ~~(to_go / 60) + ":" + ((to_go % 60) < 10 ? "0" + (to_go % 60) : (to_go % 60));
    standing = Object.values(players);
    // console.log(standing);
    for (i=0; i < standing.length; i++) {

      let p = standing[i];

          let row = this.table.rows[i + 1];
          if (!row || (row.cells[0].innerText !== p.nick)) {
            row = this.table.insertRow(i + 1);
            let cell0 = row.insertCell(0); //nickname
            cell0.className = "first-cell";
            let cell1 = row.insertCell(1); cell1.id = 'c' + p.id; //flag
            let cell2 = row.insertCell(2); //population
            let cell3 = row.insertCell(3); // border
            let cell4 = row.insertCell(4); // chat
            let cell5 = row.insertCell(5); // points

            let bordercolor = "solid rgba("+(p.color.r*255)+","+(p.color.g*255)+","+(p.color.b*255)+", 0.7)";
            cell0.style.borderLeft = "3px " + bordercolor;
            cell0.innerText = p.nick;
            cell1.innerHTML = "<img id='" + p.id + "' src='https://flagcdn.com/w40/" + p.country.toLowerCase() + ".png' width=25px height=25px onerror='inoflag(this);'>";
            cell3.style.borderRight = (p.id === me) ? "1px " + bordercolor : "none";
            cell5.innerHTML = '<div class="tooltip">' + p.points + '<span class="tooltiptext">Players points</span></div>';
          }

        if (s_updates_from_server[client_tick]) {
          p.population = s_updates_from_server[client_tick][i];
        }

        if (p.population !== p.had_population) {
            row.cells[2].innerHTML = '<div class="tooltip">' + p.population + '<span class="tooltiptext">Soldiers alive</span></div>';
            p.had_population = p.population;
        }

        if (p.new_mail !== p.had_mail || p.was_me !== me) {
          row.cells[4].innerHTML = '<a href="#chat-modal" rel="modal:open">' +
                      ( p.new_mail ? '<i class=\'material-icons small\'>mail_outline</i>' : me ? '<i id=\'chat-icon\' class=\'material-icons small\'>chat</i>' : '') +
                      '</a>';
          p.had_mail = p.new_mail;
          p.was_me = me;
          row.cells[4].onclick = function() {
            openchat_pid = p.id;
          }
        }
        if (p.population === 0) {
          row.cells[2].innerHTML = 0;
        }
    }
  },
}
