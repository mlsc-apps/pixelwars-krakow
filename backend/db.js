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

  run_query : function(sql, process_result) {
    this.connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        process_result(result);
      });
  },

  update_points : function(winner_points, winner) {
      this.run_query("UPDATE wor8630_usermeta SET wor8630_usermeta.meta_value = " + winner_points + " WHERE wor8630_usermeta.meta_key = 'points' AND wor8630_usermeta.user_id = " + winner.id, function(result){
      console.log(new Date() + ': Updated points for: ' + winner.nick,winner_points + ' ' + result.message);
    });
  },

  find_robot : function(except, process_result) {
    let q = "SELECT wor8630_usermeta.user_id FROM wor8630_usermeta WHERE meta_value = '1' AND meta_key = 'robot'";
    if (except) q += " AND NOT wor8630_usermeta.user_id = " + except;
      this.run_query(q, function(result) {
        process_result(rand(result).user_id);
    });
  },

  load_player : function(id, process_result) {
     this.run_query("SELECT wor8630_usermeta.user_id, wor8630_usermeta.meta_key, wor8630_usermeta.meta_value FROM wor8630_usermeta WHERE meta_key in ('points', 'nickname', 'country') AND user_id = " + id, function(result) {
       process_result(result);
     });
  }

}
