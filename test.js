var async = require('async');
var request = require('request');
var CronJob = require('cron').CronJob;
var FeedParser = require('feedparser');

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

new CronJob('0,20,40 * * * * *', function() {

    var counter = 0;

    async.eachSeries(urlList, function(url, callback) {

        var req = request({
            method: 'GET',
            url: url.url,
            encoding: null
        });
        var feedparser = new FeedParser();

        req.on('error', function(error) {
            console.log(error);
        });
        req.on('response', function(res) {
            var stream = this;

            if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

            stream.pipe(feedparser);
        });

        feedparser.on('error', function(error) {
            // always handle errors
        });
        feedparser.on('readable', function() {
            // This is where the action is!
            var stream = this,
                meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                ,
                item;

            //console.log(meta.link);

            counter++;
            callback(null, null);
        });


    }, function(err, results) {
        if (err) {
            console.log("error occured");
            throw err;
        }
        console.log('each all done. ' + counter);
    });

}, null, true, "Japan");