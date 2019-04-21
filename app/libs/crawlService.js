const request = require('request'),
    async = require('async'),
    ipcMain = require('electron').ipcMain,
    db = require('./dbService'),
    cheerio = require('cheerio'),
    excel = require('./excelApi');


const CrawlService = {
    start: function () {
        ipcMain.on('uploadFile', function (event, filePath ) {
            console.log('channel "uploadForm" on msg:' + filePath );
            event.sender.send('search-reply', {mails: []});
            excel.analysisdata( filePath );
        });
        ipcMain.on('search-keyword', function (event, keyword) {
            console.log('channel "search-keyword" on msg:' + keyword);

            let match = {$regex: eval('/' + keyword + '/')};
            var query = keyword ? {$or: [{title: match}, {content: match}]} : {};
            db.find(query).sort({publishDate: -1}).limit(100).exec(function (err, mails) {
                event.sender.send('search-reply', {mails: mails});
            });
        });

        ipcMain.on('start-crawl', (event, arg) => {
            console.log('channel "start-crawl" on msg:' + arg);
            var updater = {
                sender: event.sender,
                channel: arg,
                updateProgress: function (progress) {
                    this.sender.send(this.channel, {progress: progress});
                }
            };
            crawler(updater);
        });
    }
};

function UrlCrawler(targetUrl) {
    return {
        targetUrl: targetUrl,
        startCrawl: function (processDom) {
            request(this.targetUrl, (err, response, body) => {
                if (err) throw err;
                var $ = cheerio.load(body);
                processDom($)
            });
        }
    };
}

function pageCrawl(page, totalPage, updater, crawlNextPage, crawProgress) {
    new UrlCrawler('http://12345.chengdu.gov.cn/moreMail?page=' + page).startCrawl(($) => {
        var $pageMails = $('div.left5 ul li.f12px'),
            sameMailsInPage = 0;

        async.eachOfLimit($pageMails, 10, function iteratee(item, key, nextMail) {
            if(crawProgress.skip){
                return nextMail();
            }
            let $item = $(item),
                mailDetailUrl = $item.find('a').prop('href'),
                divs = $item.find('div');
            var mail = {
                _id: mailDetailUrl.match(/\d+/g)[0],
                title: $(divs[0]).text().trim(),
                sender: $(divs[1]).text().trim(),
                receiveUnit: $(divs[2]).text().trim(),
                status: $(divs[3]).text().trim(),
                category: $(divs[4]).text().trim(),
                views: $(divs[5]).text().trim()
            };

            new UrlCrawler('http://12345.chengdu.gov.cn/' + mailDetailUrl).startCrawl(($) => {// crawl mail detail
                mail.content = $($('.rightside1 td.td2')[1]).text().trim();
                mail.result = $('.rightside1 tbody tr:last-child').text().trim();
                mail.publishDate = $($('.rightside1 td.td32')[0]).text().trim() || $($('.rightside1 td.td32')[1]).text().trim();

                console.log(mail._id);

                db.update({_id: mail._id}, mail, {upsert: true, returnUpdatedDocs: true}, function (err, numReplaced, affectedDocuments, upsert) {
                    if (err) {
                        throw err;
                    }
                    if(!upsert && affectedDocuments.result == mail.result){//if a mail are not update
                        if(++sameMailsInPage == 15){ //if all mails in one page are note update.
                            crawProgress.skip = true;
                        }
                    }
                });

                nextMail();
            });
        }, function done() {
            crawlNextPage();
            updater.updateProgress(Math.floor(page * 100 / totalPage));
        });
    });
}

/**
 * 1. get total page size
 * 2. iterator from page 1 to totalSize
 *    2.1 fetch mails summary list on 1 page
 *    2.2 iterator from mails 1 to maxItems mails summary in 1 page
 *        2.2.1 fetch mails detail from url
 *        2.2.2 save mail to db
 *    2.3 test if none of mails in current page updated? if none, stop crawling or continue step 2.
 *
 * @param url
 */
function crawler(updater) {
    new UrlCrawler('http://12345.chengdu.gov.cn/moreMail').startCrawl(($) => {
        var totalSize = $('div.pages script').html().match(/iRecCount = \d+/g)[0].match(/\d+/g)[0],

            totalSize = 15 , //测试写死
            totalPageSize = Math.ceil(totalSize / 15),
            pagesCollection = [],
            crawProgress = {skip: false};
        for (let i = 1; i <= totalPageSize; i++) {
            pagesCollection.push(i);
        }
        async.eachSeries(pagesCollection, function (page, crawlNextPage) {
            pageCrawl(page, totalPageSize, updater, crawlNextPage, crawProgress);
        })
    });
}

module.exports = CrawlService;
