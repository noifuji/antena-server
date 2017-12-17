
/**
 * Module dependencies.
 */

var express = require('express')
  , resource = require('express-resource') 
  , routes = require('./routes')
  , user = require('./routes/entry')
  , http = require('http')
  , path = require('path');
var fs = require('fs');
var url = require('url');

var app = express();


// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/users', user.list);
app.resource('entry', require('./routes/entry'));
app.resource('past', require('./routes/past'));
app.resource('description', require('./routes/description'));
app.resource('rss', require('./routes/rss'));
app.resource('v2/entry', require('./routes/v2/entry'));
app.resource('v2/searchEntry', require('./routes/v2/searchEntry'));

app.get('/thumbnail', function(req, res){
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    console.log(query.name);
    try{
    var buf = fs.readFileSync('./thumbnail/' + query.name + '.png');
    res.send(buf, { 'Content-Type': 'image/jpeg' }, 200);
    } catch (err) {
      console.log(err);
      res.send("", { 'Content-Type': 'image/jpeg' }, 500);
    }
});

app.options('*', function (req, res) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', "Origin, X-Auth-Token, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  res.send("ok", 200);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});