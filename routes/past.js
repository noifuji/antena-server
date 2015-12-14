'use strict';

var express = require('express');
var router = express.Router();
var FeedParser = require('feedparser');
var http = require('http');
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
            $lt: query.time
          }
        })
        .sort('-publicationDate')
        .skip(0)
        .limit(50)
        .exec(function(err, docs) {
          var result;
          result = {
            'message': "OK",
            'category': query.category,
            'entries': docs
          };
          response.json(result);
        });
    }
    else {

      Entries.find({
          "publicationDate": {
            $lt: query.time
          },
          "category": query.category
        })
        .sort('-publicationDate')
        .skip(0)
        .limit(50)
        .exec(function(err, docs) {
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
