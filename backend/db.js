const mysql = require('mysql');

module.exports = {

  connection : null,

  init : function() {
        this.connection = mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: decrypt(process.env.DB_PASSWORD),
          database: process.env.DB_NAME
        });

        this.connection.connect(function(err) {
          if (err) throw err;
          console.log(new Date() + ": database connection successful");
        });
  },

  runQuery : function(sql, processResult) {
    this.connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        processResult(result);
      });
  },

  updatePoints : function(winnerPoints, winner) {
      this.runQuery("UPDATE wor8630_usermeta SET wor8630_usermeta.meta_value = " + winnerPoints + " WHERE wor8630_usermeta.meta_key = 'points' AND wor8630_usermeta.user_id = " + winner.id, function(result){
      console.log(new Date() + ': Updated points for: ' + winner.nick,winnerPoints + ' ' + result.message);
    });
  },

  findRobot : function(except, processResult) {
    let q = "SELECT wor8630_usermeta.user_id FROM wor8630_usermeta WHERE meta_value = '1' AND meta_key = 'robot'";
    if (except) q += " AND NOT wor8630_usermeta.user_id = " + except;
      this.runQuery(q, function(result) {
        processResult(rand(result).user_id);
    });
  },

  loadPlayer : function(id, processResult) {
     this.runQuery("SELECT wor8630_usermeta.user_id, wor8630_usermeta.meta_key, wor8630_usermeta.meta_value FROM wor8630_usermeta WHERE meta_key in ('points', 'nickname', 'country') AND user_id = " + id, function(result) {
       processResult(result);
     });
  }

}
