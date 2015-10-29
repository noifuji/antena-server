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
        console.log(query.id);

        Entries.find({
                "_id": query.id
            })
            .exec(function(err, docs) {
                var result;
                if (docs.length != 0) {
                    result = {
                        'message': "OK",
                        'entry': {
                            '_id': docs[0]._id,
                            'description': docs[0].description
                        }
                    };
                }
                else {
                    result = {
                        'message': "Error"
                    };
                }
                response.json(result);
            });
    }
};
