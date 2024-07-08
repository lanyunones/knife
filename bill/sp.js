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

        let sql = `select order_detail_id,account_id from bill_supplement group by order_detail_id,account_id`
        let bill = await db.query(sql)
        bill = bill[0]

        //bill = [{ order_detail_id: '0570684d729d2ab1', account_id: 9001192 }]

        for (const item of bill) {
            let sql = `select id,account_id,order_detail_id,statistic_data->'$.money_sum' as money_sum  from contract_bill where bill_type="月度" and is_deleted=0 and account_id=${item.account_id} and order_detail_id='${item.order_detail_id}' order by id,statistical_year,statistical_month asc`
            let list = await db.query(sql)
            list = list[0]

            for (const l of list) {
                if (l.money_sum == null) { continue }
                let sqlC = `select IFNULL(sum(balance),0) as balance from bill_supplement where order_detail_id='${l.order_detail_id}' and account_id=${l.account_id} and bid <=${l.id}`
                let balance = await db.query(sqlC)
                balance=new Decimal(balance[0][0].balance).toFixed()
                let qk = new Decimal(l.money_sum).sub(balance).toFixed()
                let sql1 = `
                    update contract_bill set 
                        statistic_data=JSON_SET(statistic_data,'$.money_refund','${balance}'),
                        statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}')
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