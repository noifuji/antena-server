var async = require('async');
var request = require('request');
var CronJob = require('cron').CronJob;
var feedparser = require('ortoo-feedparser');
var model = require('./model/model.js');
var Entries = model.Entries;
var easyimg = require('easyimage');
var fs = require('fs');

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

var job = new CronJob('0 0-59/10 * * * *', function() {

    console.log(new Date());

    var counter = 0;

    async.eachSeries(urlList, function(url, callback) {
        
        var entries = [];

        request({
            method: 'GET',
            url: url.url,
            encoding: null,
            timeout:500
        }, function(error, response, body) {
            if(error) {
                console.log("error : " + error);
                callback(null, null);
                return;
            }
            // body is the decompressed response body 
            //console.log('status code is: ' + JSON.parse(parser.toJson(body)).rdf.channel.title);
            feedparser.parseString(body, function(e, m ,a) {
                if (error || !m || !a) {
                    console.error(error);
                    callback(null,null);
                    return;
                }
                //console.log(m.title);
                
                for(var i = 0; i < a.length; i++) {
                    var thumnailUrlList = a[i]["content:encoded"]["#"].match(/(http:){1}[\S_-]+((\.png)|(\.jpg)|(\.JPG)|(\.gif))/);
                            var thumnail;
                            if (thumnailUrlList != null) {
                                thumnail = thumnailUrlList[0];
                            }
                            else {
                                //thumnail = "https://antena-noifuji.c9.io/images/default.png";
                                thumnail = "";
                            }
                            var pubDate = new Date(a[i].pubDate).getTime();
                            var now = new Date().getTime();
                            var ep = {
                                'title': a[i].title,
                                'url': a[i].link,
                                'publicationDate': (pubDate > now ? now : pubDate),//何故か日付が未来の場合があるので修正する
                                'thumbnail': thumnail,
                                'description': a[i].description
                            };
                            entries.push(ep);
                }
                
                async.each(entries, function(e, entryCallback) {
                            var entry = new Entries();
                            entry.title = e.title;
                            entry.url = e.url;
                            entry.publicationDate = e.publicationDate;
                            entry.thumbnail = e.thumbnail;
                            entry.sitetitle = m.title;
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
                            counter++;
                            callback(null, null);
                        });
            });
            
        });
    }, function(err, results) {
        if (err) {
            console.log("error occured");
            throw err;
        }
        console.log('each all done. ' + counter);
        console.log(new Date());
    });

}, null, true, "Japan");

function getFilename(url) {
    var temp = url.split('/');
    return temp[temp.length - 1];
}

function splitExt(filename) {
    return filename.split(/\.(?=[^.]+$)/);
}

job.start();