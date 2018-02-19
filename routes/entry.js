'use strict';

var model = require('../model/model.js');
var Entries = model.Entries;
var url = require('url');

module.exports = {
  index: function(request, response) {

    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    console.log("time:" + query.time + ", category:" + query.category);

    if (query.category == "") {
      console.log("true");
      Entries.find({
          "publicationDate": {
            $gt: query.time
          }
        })
        .sort('-publicationDate')
        .skip(0)
        .limit(40)
        .exec(function(err, docs) {
          //docsの軽量化
          for (var i = 0; i < docs.length; i++) {
            docs[i].description = "";
          }
          var result;
          result = {
            'message': "OK",
            'category': query.category,
            'entries': docs
          };
          //response.setHeader('Access-Control-Allow-Origin', request.protocol + '://' + request.headers.host);
          response.setHeader('Access-Control-Allow-Origin', "*");
          response.json(result);
        });
    }
    else {

      Entries.find({
          "publicationDate": {
            $gt: query.time
          },
          "category": query.category
        })
        .sort('-publicationDate')
        .skip(0)
        .limit(1000)
        .exec(function(err, docs) {
          //docsの軽量化
          for (var i = 0; i < docs.length; i++) {
            docs[i].description = "";
          }
          var result;
          result = {
            'message': "OK",
            'category': query.category,
            'entries': docs
          };
          response.json(result);
        });
    }
  }
};
