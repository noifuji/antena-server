var FeedParser = require('feedparser');
var http = require('http');
var model = require('./model/model.js');
var Entries = model.Entries;

var CronJob = require('cron').CronJob;
var urlList = ['http://himasoku.com/index.rdf', 'http://kabooo.net/index.rdf', 'http://alfalfalfa.com/index.rdf', "http://blog.livedoor.jp/news23vip/index.rdf"];
new CronJob('0 0-45/15 * * * *', function() {
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
                console.log('Cron job has started.     ' + new Date() + "     " + urlList[j]);
                var feedMeta;
                var entries = [];

                // 指定urlにhttpリクエストする
                http.get(urlList[j], function(res) {
                    //レスポンスにフィードパーサをパイプで渡す
                    res.pipe(new FeedParser({}))
                        .on('error', function(error) {
                            console.log(error);
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
                                    'thumbnail': thumnail
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

                                var date = new Date(entries[i].publicationDate);

                                if (date > lastUpdate) {
                                    console.log(entry);
                                    entry.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            }

                        });
                });
            })(j);
        }
    });
}, null, true, "Japan");