const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const XLSX = require('xlsx');
const time = require('../common/time');

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
        let sql = `select * from ly_bill order by id asc`
        let bill = await db.query(sql)
        bill = bill[0]

        for (const item of bill) {
            let sql = `
            update contract_bill set 
                statistic_data=JSON_SET(statistic_data,'$.giftsAmount','${item.giftsAmount}'),
                statistic_data=JSON_SET(statistic_data,'$.money_cycle','${item.money_cycle}'),
                statistic_data=JSON_SET(statistic_data,'$.money_sum','${item.money_sum}'),
                statistic_data=JSON_SET(statistic_data,'$.money_debt','${item.money_debt}')
            where 
                id=${item.id}`

            await db.query(sql)
            console.log(item.id);
        }




    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();