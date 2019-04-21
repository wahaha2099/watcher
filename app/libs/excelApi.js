const xlsx = require('node-xlsx');


const excel = {
    analysisdata: function( filePath ) {//导入Excel，xlsx格式
        //解析xlsx
        let v = xlsx.parse( filePath );

        console.log("xlsx =" ,v);//xlsx = [ { name: 'Sheet1', data: [ [Array], [Array], [Array] ] } ]
        console.log("数据 = ",v[0]);//数据 =  { name: 'Sheet1',  data: [ [ '姓名', '年龄' ], [ '张三', 20 ], [ '李四', 30 ] ]}

        //data,多少行数据就有多少行
        console.log("要上传的数据 = ",v[0].data[0]);//要上传的数据 =  [ [ '姓名', '年龄' ], [ '张三', 20 ], [ '李四', 30 ] ]
    }
}

//使用方法 excel.analysisdata();
module.exports = excel;