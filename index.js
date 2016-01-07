/**
 * Created by Testuser on 31.03.2015.
 */

var CronJob = require('cron').CronJob;
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var request = require('request');
var easyimg = require('easyimage');
var getPixels = require("get-pixels");

// Create folder if not existing
if (!fs.existsSync(__dirname + '/public/pics')){
  fs.mkdirSync(__dirname + '/public/pics');
}

if (!fs.existsSync(__dirname + '/resources/temp')){
  fs.mkdirSync(__dirname + '/resources/temp');
}


//Start Server with express and socket.io
server.listen(80);

//Send the index.html file
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/resources/index.html');
});

//Serve the public repo
app.use('/public', express.static('bilder'));

//Start a cron job that loads a new Image every 30 seconds
new CronJob('*/30 * * * * *', function () {
    getImage(emitAll);
  }, function () {
    console.log("stop");
  },
  true,
  ""
);


function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

function getImage(cb) {

  var ts = Date.now();
  //Download picture with get to avoid network caching
  download('http://polaris.nipr.ac.jp/~acaurora/aurora/Tromso/latest.jpg?' + ts, __dirname + '/public/pics/' + ts + '.jpg', function () {
    // Alternative URL for the weather station in Longyearbyen
    // download('http://polaris.nipr.ac.jp/~acaurora/aurora/Longyearbyen/latest.jpg?' +  ts , __dirname + '/bilder/' + ts + '.jpg', function(){

    //crop and analyse the image
    cropImage(ts, analyseImage);
    // Server the downloaded image to the clients
    cb(ts);
  });
}

//Serve the image to the clients
function emitAll(ts) {
  io.sockets.emit('reload', {ts: ts});
}


function cropImage(ts, cb) {
  easyimg.exec('composite -compose Dst_In -gravity center ' + __dirname + '/resources/mask.png ' + __dirname + '/public/pics/' + ts + '.jpg ' + __dirname + '/resources/temp/' + ts + '.jpg').then(
    function () {
      cb(ts);
    }, function (err) {
      console.log(err);
    }
  );
}


function analyseImage(ts) {

  var imagepath = __dirname + '/resources/temp/' + ts + '.jpg';

  //Get every pixel
  getPixels(imagepath, function (err, pixels) {

    if (err) throw err;

    var nx = pixels.shape[0];
    var ny = pixels.shape[1];
    var totalColor = [0, 0, 0];
    var greenpixel = 0;


    //Loop over all cells
    for (var i = 1; i < nx - 1; ++i) {
      for (var j = 1; j < ny - 1; ++j) {

        var pixel = [
          pixels.get(i, j, 1), //Green
          pixels.get(i, j, 2), //Blue
          pixels.get(i, j, 4)  //Red
        ];

        var sum = pixel.reduce(function (pv, cv) {
          return pv + cv;
        }, 0);

        if (sum > 10) {
          //Not Black

          //If a pixel has a high green value and is not just bright in general
          if (pixel[0] > 228 && pixel[0] > pixel[1] && pixel[0] > pixel[2]) {
            greenpixel++;
          }

          totalColor[0] += pixel[0];
          totalColor[1] += pixel[1];
          totalColor[2] += pixel[2];
        }
      }
    }

    //Very simple check. Could be optimized by working with totalColor[] and more detailed pixel analysis
    if (greenpixel > 2000) {
      io.sockets.emit('alarm', {});
    }

    console.log(ts, greenpixel);
  });
}
