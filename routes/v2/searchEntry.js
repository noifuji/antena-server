'use strict';

var model = require('../../model/model.js');
var Entries = model.Entries;
var url = require('url');

module.exports = {
  index: function(request, response) {

    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    console.log("time:" + query.time + ", like:" + query.like);

      Entries.find({
          "publicationDate": {
            $lt: query.time
          },
          "title" : new RegExp(query.like, 'i')
        })
        .sort({'publicationDate':-1})
        .skip(0)
        .limit(1000)
        .exec(function(err, docs) {
          var resultText = "";
          for(var i = 0; i < docs.length; i++) {
            resultText = resultText + '<div><a  target="_blank" href="'+docs[i].url+'">'+docs[i].title+'</a><img  src="http://b.hatena.ne.jp/entry/image/large/'+docs[i].url+'"></div>';
          }
          response.setHeader('Access-Control-Allow-Origin', "*");
          response.header('Content-Type', 'text/plain;charset=utf-8');
          response.end(resultText);
        });
  }
};
