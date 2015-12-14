var FeedParser = require('feedparser');
var http = require('http');
var model = require('./model/model.js');
var Entries = model.Entries;
var async = require('async');
var easyimg = require('easyimage');

var request = require('request');
var fs = require('fs');

var CronJob = require('cron').CronJob;
var urlList = [
    //ニュース
    {
        url: 'http://himasoku.com/index.rdf',
        category: "news"
    }, {
        url: "http://news.2chblog.jp/index.rdf",
        category: "news"
    }, {
        url: "http://blog.livedoor.jp/itsoku/index.rdf",
        category: "news"
    },
    /*{
            url: "http://blog.livedoor.jp/funs/index.rdf",
            category: "news"
        },*/
    {
        url: "http://worldrankingup.blog41.fc2.com/?xml",
        category: "news"
    }, {
        url: "http://news4wide.livedoor.biz/index.rdf",
        category: "news"
    }, {
        url: 'http://alfalfalfa.com/index.rdf',
        category: "news"
    }, {
        url: "http://blog.livedoor.jp/nwknews/index.rdf",
        category: "news"
    },
    //金融
    {
        url: 'http://kabooo.net/index.rdf',
        category: "money"
    },
    /*{
            url: "http://www.fx2ch.net/feed",
            category: "money"
        },*/
    {
        url: "http://fxnetmatome.blog.fc2.com/?xml",
        category: "money"
    }, {
        url: "http://usdjpy-fxyosou.blog.jp/index.rdf",
        category: "money"
    }, {
        url: "http://okanehadaiji.com/index.rdf",
        category: "money"
    },
    //VIP
    {
        url: "http://blog.livedoor.jp/news23vip/index.rdf",
        category: "vip"
    }, {
        url: "http://vippers.jp/index.rdf",
        category: "vip"
    }, {
        url: "http://brow2ing.doorblog.jp/index.rdf",
        category: "vip"
    }, {
        url: "http://hamusoku.com/index.rdf",
        category: "vip"
    }, {
        url: "http://blog.livedoor.jp/goldennews/index.rdf",
        category: "vip"
    }, {
        url: "http://katuru2ch.blog12.fc2.com/?xml",
        category: "vip"
    }, {
        url: "http://blog.livedoor.jp/kinisoku/index.rdf",
        category: "vip"
    }, {
        url: "http://blog.livedoor.jp/nonvip/index.rdf",
        category: "vip"
    },
    //スポーツ
    {
        url: "http://blog.livedoor.jp/rock1963roll/index.rdf",
        category: "sports"
    }, {
        url: "http://football-2ch.com/index.rdf",
        category: "sports"
    }, {
        url: "http://blog.livedoor.jp/yakiusoku/index.rdf",
        category: "sports"
    },
    /*{
            url: "http://blog.livedoor.jp/news4vip2/index.rdf",
            category: "sports"
        },*/
    //鬼女
    {
        url: "http://kosonews.blog135.fc2.com/?xml",
        category: "kijo"
    }, {
        url: "http://kosodatech.blog133.fc2.com/?xml",
        category: "kijo"
    }, {
        url: "http://kijosoku.com/index.rdf",
        category: "kijo"
    }, {
        url: "http://www.kitimama-matome.net/index.rdf",
        category: "kijo"
    }
];

//配列からurlを取得
//URLに対してgetを投げる　　　　　　　　　　→async.each化
//　受け取った結果に対してparserを発動　　　
//　　1エントリごとにデータの重複チェック　　→async.each化?
//　　　データの保存

new CronJob('0 0-59/10 * * * *', function() {

    async.each(urlList, function(url, callback) {



        // exec http request
        var getRequest = http.get(url.url, function(response) {
            if (response.statusCode == 200) {
                var feedMeta;
                var entries = [];
                
                //レスポンスにフィードパーサをパイプで渡す
                response.pipe(new FeedParser({}))
                    .on('error', function(error) {
                        console.log(error + ":" + url.url);
                    })
                    .on('meta', function(meta) {
                        feedMeta = meta;
                    })
                    .on('readable', function() {
                        var stream = this,
                            item;

                        // chunkデータを保存する
                        while (item = stream.read()) {
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
                            var ep = {
                                'title': item.title,
                                'url': item.link,
                                'publicationDate': (pubDate > now ? now : pubDate),//何故か日付が未来の場合があるので修正する
                                'thumbnail': thumnail,
                                'description': item.description
                            };
                            entries.push(ep);
                        }
                    })
                    .on('end', function() {
                        //console.log(feedMeta.title + " has " + entries.length + " entries.");
                        async.each(entries, function(e, entryCallback) {
                            var entry = new Entries();
                            entry.title = e.title;
                            entry.url = e.url;
                            entry.publicationDate = e.publicationDate;
                            entry.thumbnail = e.thumbnail;
                            entry.sitetitle = feedMeta.title;
                            entry.description = e.description;
                            entry.category = url.category;

                            Entries.find({
                                url: entry.url
                            }, function(err, docs) {
                                if (docs.length == 0) {
                                    console.log((new Date()) + " : <" + entry.sitetitle + "> " + entry.title);
                                    entry.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            if (entry.thumbnail != "") {
                                                request({
                                                        method: 'GET',
                                                        url: entry.thumbnail,
                                                        encoding: null
                                                    },
                                                    function(error, response, body) {
                                                        var filename = getFilename(entry.thumbnail);
                                                        if (!error && response.statusCode === 200) {
                                                            fs.writeFileSync('./img/' + filename, body, 'binary');
                                                            
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
                                                                    easyimg.convert({
                                                                        src: './thumbnail/' + image.name,
                                                                        dst: './thumbnail/' + splitExt(image.name)[0] + '.png',
                                                                        quality: 10
                                                                    }).then(function(file) {
                                                                        console.log("converted filename : " + file.name);
                                                                        fs.unlink('./thumbnail/' + image.name, function(err) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                            };
                                                                            console.log('successfully deleted');
                                                                        });
                                                                    });
                                                                },
                                                                function(err) {
                                                                    console.log(err);
                                                                }
                                                            );
                                                        }

                                                    }
                                                );
                                            }
                                        }
                                    });
                                }
                                entryCallback(null, null);
                            });
                        }, function(err, results) {
                            if (err) {
                                throw err;
                            }
                            //console.log('The entry has checked.');

                            entries = [];
                            callback(null, null);
                        });
                    });
            }

        }).on('error', function(e) {
            console.log("Got error: " + e.message + "\nstack:" + e.stack + "\nline:" + e.lineNumber);
            callback(null, null);
        });

        getRequest.setTimeout(30000, function() {
            // handle timeout here
            console.log('timeout!! :' + url.url);
            callback(null, null);
        });


    }, function(err, results) {
        if (err) {
            console.log("error occured");
            throw err;
        }
        console.log('each all done. ');
    });


}, null, true, "Japan");

function getFilename(url) {
    var temp = url.split('/');
    return temp[temp.length - 1];
}

function splitExt(filename) {
    return filename.split(/\.(?=[^.]+$)/);
}