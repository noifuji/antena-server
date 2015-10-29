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
    
    var url_parts = url.parse(request.url,true);
    var query = url_parts.query;
    console.log(query.time);

  Entries.find({"publicationDate": {$gt: query.time}})
  .sort('-publicationDate')
  .skip(0)
  .limit(50)
  .exec(function(err, docs) {
      var result;
      result = {
        'message': "OK",
        'entries': docs
      };
      response.json(result);
    });
  }
};

