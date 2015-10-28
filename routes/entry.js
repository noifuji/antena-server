'use strict';

var express = require('express');
var router = express.Router();
var FeedParser = require('feedparser');
var http = require('http');
var model = require('../model/model.js');
var Entries = model.Entries;

module.exports = {
  index: function(request, response) {

  Entries.find({})
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

