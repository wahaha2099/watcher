const ipcMain = require('electron').ipcMain,
    crawlService = require('./crawlService'),
    excel = require('./excelApi');

const controller = {
    start: function () {
        ipcMain.on('uploadFile', function (event, filePath ) {
        });
        ipcMain.on('search-keyword', function (event, keyword) {
        });
        ipcMain.on('start-crawl', (event, arg) => {
        });
    }
};

module.exports = controller;
