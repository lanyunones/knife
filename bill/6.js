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

        let ids = [
            3490,
            3500,
            3528,
            3439,
            3492,
            3456,
            3442,
            3467,
            3493,
            3506,
            3487,
            3525]

        let sql = `select order_detail_id,account_id from contract_bill where id in (${ids.join(',')}) group by order_detail_id,account_id`
        let bill = await db.query(sql)
        bill = bill[0]


        for (const item of bill) {
            let sql = `select id,statistic_data->'$.money_cycle' as money_cycle,statistic_data->'$.money_refund' as money_refund  from contract_bill where is_deleted=0 and account_id='${item.account_id}' and order_detail_id='${item.order_detail_id}' order by id,statistical_year,statistical_month asc`
            let list = await db.query(sql)
            list = list[0]
            let lj = '0'
            for (const l of list) {

                if (l.money_cycle == null || l.money_cycle == "") {
                    continue;
                }

                // 当月消费数据量
                let money_cycle
                if (l.money_cycle == null || l.money_cycle == "") {
                    money_cycle = '0'
                } else {
                    money_cycle = l.money_cycle
                }

                let money_refund

                if (l.money_refund == null || l.money_refund == "") {
                    money_refund = '0'
                } else {
                    money_refund = l.money_refund
                }

                lj = new Decimal(lj).add(money_cycle).toFixed()
                let qk = new Decimal(lj).sub(money_refund).toFixed()
                let sql1 = `
                    update contract_bill set 
                        statistic_data=JSON_SET(statistic_data,'$.money_sum','${lj}'),
                        statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}'),
                        statistic_data=JSON_SET(statistic_data,'$.money_refund','${money_refund}')
                    where 
                        id=${l.id}`

                await db.query(sql1)
            }
            console.log(item.account_id, item.order_detail_id);
        }


        // let sql = `
        //     update contract_bill set 
        //         statistic_data=JSON_SET(statistic_data,'$.giftsAmount','${item.giftsAmount}'),
        //         statistic_data=JSON_SET(statistic_data,'$.money_cycle','${item.money_cycle}'),
        //         statistic_data=JSON_SET(statistic_data,'$.money_sum','${item.money_sum}'),
        //         statistic_data=JSON_SET(statistic_data,'$.money_debt','${item.money_debt}')
        //     where 
        //         id=${item.id}`

        // await db.query(sql)
        // console.log(item.id);


    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();