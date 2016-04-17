var async = require('async');
var http = require('http');
var request = require('request');
var FeedParser = require('feedparser');
var easyimg = require('easyimage');
var fs = require('fs');
var model = require('./model/model.js');
var Entries = model.Entries;

/*
async.series　各URL
 async.waterfall rdf情報取得
 　　　　　　　　結果の
 　　　　　 　　　DB検索
 　　　　　 　　　保存
 　　　　 　　　　サムネイル取得
 　　　　 　　　　保存
 　　　　 　　　　加工して保存
 　　　 　　　　　ファイル名変換
*/

async.waterfall([
    function(callback) {
        console.log('rdf情報取得');
        var req = http.get("http://kosodatech.blog133.fc2.com/?xml", function(response) {
            //次タスクへ
            callback(null, response);
        }); //TODO:URL変更

        req.setTimeout(10000);

        req.on('timeout', function() {
            console.log('request timed out');
            req.abort()
        });

        req.on('error', function(e) {
            console.log("Got error: " + e.message + "\nstack:" + e.stack + "\nline:" + e.lineNumber);
            callback(e);
        });
    },
    function(res, callback) {
        console.log('結果のパース');
        var feedMeta;
        var entries = [];
        var parser = res.pipe(new FeedParser({}));

        parser.on('error', function(error) {
            console.log(error);
            callback(error);
        });
        parser.on('meta', function(meta) {
            feedMeta = meta;
        });
        parser.on('readable', function() {
            var stream = this;
            var item;

            // chunkデータを保存する
            while (item = stream.read()) {
                //gets thumbnail url
                var thumnailUrlList = item["content:encoded"]["#"].match(/(http:){1}[\S_-]+((\.png)|(\.jpg)|(\.JPG)|(\.gif))/);
                var thumnail;
                if (thumnailUrlList != null) {
                    thumnail = thumnailUrlList[0];
                }
                else {
                    //thumnail = "https://antena-noifuji.c9.io/images/default.png";
                    thumnail = "";
                }

                var pubDate = new Date(item.pubDate).getTime();
                var now = new Date().getTime();
                var entry = {
                    'title': item.title,
                    'url': item.link,
                    'publicationDate': (pubDate > now ? now : pubDate), //何故か日付が未来の場合があるので修正する
                    'thumbnail': thumnail,
                    'description': item.description,
                    'sitetitle': feedMeta.title,
                    'category': ""
                };

                entries.push(entry);
            }
        });
        parser.on('end', function() {
            callback(null, entries);
        });

    },
    function(entries, callback) {
        var taskGenerator = (function() {
            var i = 0;
            return function(callback) {
                var entry = entries[i];
                i++;

                //async.waterfall
                console.log(entry.title);
                async.waterfall([
                    function(callback) {
                        //search
                        console.log("[find]");
                        Entries.find({
                            url: entry.url
                        }, function(err, docs) {
                            if (err) {
                                callback(err);
                            }
                            else if (docs.length != 0) {
                                callback("This entry has already been saved.");
                            }
                            else {
                                console.log((new Date()) + " : <" + entry.sitetitle + "> " + entry.title);
                                callback(null, 1);
                            }
                        });
                    },
                    function(args, callback) {
                        //save
                        console.log("[insert]");
                        var newEntry = new Entries();
                        newEntry.title = entry.title;
                        newEntry.url = entry.url;
                        newEntry.publicationDate = entry.publicationDate;
                        newEntry.thumbnail = entry.thumbnail;
                        newEntry.sitetitle = entry.sitetitle;
                        newEntry.description = entry.description;
                        newEntry.category = entry.category;

                        newEntry.save(function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                callback(null, 1);
                            }
                        });
                    },
                    function(arg, callback) {
                        //search
                        console.log("[find]");
                        Entries.find({
                            url: entry.url
                        }, function(err, docs) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                console.log(docs[0]._id);
                                callback(null, docs[0]._id);
                            }
                        });
                    },
                    function(filename, callback) {
                        //get thumbnail
                        console.log("[get thumbnail]");
                        if (entry.thumbnail == "") {
                            callback("Error : This entry doesn't have thumbnail.");
                        }
                        else {
                            request({
                                    method: 'GET',
                                    url: entry.thumbnail,
                                    encoding: null
                                },
                                function(error, response, body) {
                                    if (error) {
                                        callback(error);
                                    } else if(response.statusCode !== 200){
                                        callback("Error : response status code is " + response.statusCode);
                                    }
                                    else {
                                        console.log("thumbnail downloaded!!!!!!!!!!!!!!");
                                        //var filename = getFilename(entry.thumbnail);
                                        fs.writeFileSync('./img/' + filename, body, 'binary');
                                        callback(null, filename);
                                    }
                                });
                        }
                    },
                    function(filename, callback) {
                        //resize
                        console.log("[resize]");
                        easyimg.thumbnail({
                            src: './img/' + filename,
                            dst: './thumbnail/' + filename,
                            width: 144,
                            height: 144,
                            x: 0,
                            y: 0
                        }).then(
                            function(image) {
                                console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
                                callback(null, image, filename);
                            },
                            function(err) {
                                callback(err);
                            });
                    },
                    function(image, filename, callback) {
                        //convert
                        console.log("[delete]");
                        fs.unlink('./img/' + filename, function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                callback(null, image);
                            }
                        });
                    },
                    function(image, callback) {
                        //convert
                        console.log("[convert]");
                        easyimg.convert({
                            src: './thumbnail/' + image.name,
                            dst: './thumbnail/' + splitExt(image.name)[0] + '.png',
                            quality: 10
                        }).then(function(file) {
                            console.log("converted filename : " + file.name);
                            callback(null, image);
                        });
                    },
                    function(image, callback) {
                        //convert
                        console.log("[delete]");
                        fs.unlink('./thumbnail/' + image.name, function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                callback(null);
                            }
                        });
                    },
                ], function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('entry waterfall done');
                    callback();
                });
            }
        })(entries);

        var tasks = [];
        for (var j = 0; j < entries.length; j++) {
            tasks[j] = taskGenerator;
        }

        async.series(tasks,
            function(err, result) {
                if (err) {
                    console.log(err);
                }
                console.log("entry done");
                callback(null, 1);
            });
    }
], function(err) {
    if (err) {
        console.log(err);
    }
    console.log('all done.');
});

function getFilename(url) {
    var temp = url.split('/');
    return temp[temp.length - 1];
}

function splitExt(filename) {
    return filename.split(/\.(?=[^.]+$)/);
}