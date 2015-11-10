var FeedParser = require('feedparser');
var http = require('http');
var model = require('./model/model.js');
var Entries = model.Entries;

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
    }, {
        url: "http://blog.livedoor.jp/funs/index.rdf",
        category: "news"
    }, {
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
    }, {
        url: "http://www.fx2ch.net/feed",
        category: "money"
    }, {
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
    }, {
        url: "http://blog.livedoor.jp/news4vip2/index.rdf",
        category: "sports"
    },
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
new CronJob('0 0-50/1 * * * *', function() {
    //過去のエントリーを検索し最新の日時のものより新しい記事を取得する。
    Entries.findOne({}).sort('-publicationDate').exec(function(err, doc) {
        var lastUpdate;

        if (doc == null) {
            lastUpdate = 0;
        }
        else {
            lastUpdate = new Date(doc.publicationDate);
        }

        for (var j = 0; j < urlList.length; j++) {
            (function(j) {
                console.log('Cron job has started.     ' + new Date() + "     " + urlList[j].url);
                var feedMeta;
                var entries = [];

                // 指定urlにhttpリクエストする
                var req = http.get(urlList[j].url, function(res) {
                    //レスポンスにフィードパーサをパイプで渡す
                    res.pipe(new FeedParser({}))
                        .on('error', function(error) {
                            console.log(error + ":" + urlList[j].url);
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
                                    thumnail = "https://antena-noifuji.c9.io/images/default.png";
                                }
                                var ep = {
                                    'title': item.title,
                                    'url': item.link,
                                    'publicationDate': new Date(item.pubDate).getTime(),
                                    'thumbnail': thumnail,
                                    'description': item.description
                                };
                                entries.push(ep);
                            }
                        })
                        .on('end', function() {
                            // データ保存完了後、jsonに整形する
                            for (var i = 0; i < entries.length; i++) {
                                var entry = new Entries();
                                entry.title = entries[i].title;
                                entry.url = entries[i].url;
                                //              entry.summary = entries[i].summary;
                                entry.publicationDate = entries[i].publicationDate;
                                entry.thumbnail = entries[i].thumbnail;
                                entry.sitetitle = feedMeta.title;
                                entry.description = entries[i].description;
                                entry.category = urlList[j].category;

                                var date = new Date(entries[i].publicationDate);

                                if (date > lastUpdate) {
                                    console.log(entry.title);
                                    entry.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            }

                        });
                }).on('error', function(e) {
                    console.log("Got error: " + e.message);
                });
                req.end();
            })(j);
        }
    });
}, null, true, "Japan");