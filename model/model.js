/*
 * モデル
 *
 */

var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/test');

function validator(v) {
    return v.length > 0;
}

var Entries = new mongoose.Schema({
    title: {
        type: String,
        default: ""
    },
    url: {
        type: String,
        default: ""
    },
    summary: {
        type: String,
        default: ""
    },
    publicationDate: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String,
        default: "https://antena-noifuji.c9.io/images/default.png"
    },
    sitetitle: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: ""
    }
});

exports.Entries = db.model('Entries', Entries);