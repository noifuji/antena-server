'use strict';

var model = require('../model/model.js');
var RssUrls = model.RssUrls;
var url = require('url');

module.exports = {
  index: function(request, response) {

    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    console.log("sitetitle:" + query.sitetitle + ", url:" + query.url);

    if (query.sitetitle == undefined || query.url == undefined) {
      RssUrls.find()
        .sort('-publicationDate')
        .skip(0)
        .limit(1000)
        .exec(function(err, docs) {
          var result;
          result = {
            'message': "OK",
            'sites': docs
          };
          response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
          response.json(result);
        });
    }
  }
  ,new: function(request, response){
    response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
    response.send("new: called as GET method");
  }
  ,create: function(request, response){
    console.log(request.body.sitetitle);
    var rss = new RssUrls();
      rss.sitetitle = request.body.sitetitle;
      rss.url = request.body.url;
      rss.save(function(err) {
        var result;
          result = {
            'message': "OK"
          };
          response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
          response.json(result);
      });
      
        }
  ,show: function(request, response){
    response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
    response.send("show: called as GET method");
  }
  ,edit: function(request, response){
    response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
    response.send("edit: called as GET method");
  }
  ,update: function(request, response){
    response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
    response.send("update: called as PUT method");
  }
  ,destroy:function(request, response){
    console.log(request.params.rs);
        RssUrls.remove({ _id: request.params.rs }, function(err) {
        
          var result;
          result = {
            'message': "OK"
          };
    response.setHeader('Access-Control-Allow-Origin', 'https://antena-noifuji-1.c9.io');
    response.json(result);
});
    
  }
};
