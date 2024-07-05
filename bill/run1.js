const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const XLSX = require('xlsx');


/**
 * 未知
 */
let run = async function () {

    //初始化
    let args = (new execArgs())
        .addArg('-env', true, null, '运行环境')
        .parseArgs()
    let conf = require(path.join(__dirname, `../config/${args.env}`))

    // 实例化mysql道丁
    let db = mysql.createPool(conf.mysql.dowding)
    db = db.promise()

    try {
       //1,003,257
        let arr=[
            {id:2910,v:127121},
            {id:3055,v:77018},
            {id:3204,v:67402},
            {id:3344,v:100777},
        ]



        for(const item of arr){
            let giftsAmount=new Decimal(item.v).mul('10000000000').mul()
            let sql = `update bill_detail set statistic_data=JSON_SET(statistic_data,'$.officialPrice','${officialPrice}') where id=${item.id}`
            await db.query(sql)
        }




    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();