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
        //let times = time.betweenDates('2023-01-01', '2023-04-21', 'YYYYMMDD')

        let groupSql = `select contract_id,phone from ly_bill where aim_num is null group by contract_id,phone`
        let group = await db.query(groupSql)
        group = group[0]


        for (const g of group) {

            let sql = `select * from ly_bill where contract_id='${g.contract_id}' and phone='${g.phone}' order by id,year,month asc`
            let list = await db.query(sql)
            list = list[0]

            let lj = '0'
            for (const item of list) {

                let money_cycle = new Decimal(item.month_num).mul(item.factor).toFixed() //周期消耗金额
                lj = new Decimal(lj).add(money_cycle).toFixed()
                let qk = new Decimal(lj).sub(item.money_refund).toFixed()

                let sqlup = `
            update 
                ly_bill 
            set 
                money_cycle='${money_cycle}',money_sum='${lj}',money_debt='${qk}'
            where 
                id=${item.id}
            `
                await db.query(sqlup)

            }
            console.log(g.contract_id, g.phone);
        }






        //     let sql = `
        //     update 
        //         contract_bill 
        //     set 
        //         statistic_data=JSON_SET(statistic_data,'$.money_sum','${lj}'),statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}')
        //     where 
        //         id=${item["账单id"]}
        //     `
        //  await db.query(sql)



    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();