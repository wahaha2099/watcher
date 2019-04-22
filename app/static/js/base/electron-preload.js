/**
 * Created by ybak on 16/9/15.
 */
// 解决require冲突导致jQuery等组件不可用的问题
window.nodeRequire = require;


delete window.require;
delete window.exports;
delete window.module;


// 解决chrome调试工具devtron不可用的问题
try {
    window.__devtron = {require: nodeRequire, process: process}
}catch(e){

}
//require = false;
//console.log( require );
