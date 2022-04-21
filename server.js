const http      = require('http');
const app       = require('./app');
const pixelwars = require('./engine/main');
const fs = require('fs');
const dotenv = require('dotenv');

let mode = process.env.PIXELWARS_ENV || 'dev.env';
console.log(new Date() + ': Reading configuration from: ' + ` ${mode}`);
dotenv.config({ path: './engine/config/' + mode });
let httpport = process.env.HTTP_PORT || 3000;

const httpserver = http.createServer(app);

httpserver.listen(httpport, function(err) {
        app.hostname = httpserver.address().address.replace('::', 'localhost');
        app.port = httpserver.address().port;
});
console.log(new Date() + ': http server started on port ' + httpport);

pixelwars.start();
console.log(new Date() + ': pixelwars server started');
