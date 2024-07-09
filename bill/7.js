const mysql = require('mysql2');
const path = require('path')
const { get, sumBy } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const XLSX = require('xlsx');
const time = require('../common/time');
const axios = require('axios');

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

        let sql = `select 
            b.id,b.order_detail_id,b.account_id,c.contract_id,b.statistic_data
        from 
            contract_bill b left join contract c on b.account_id = c.account_id and b.order_detail_id = c.order_detail_id 
        where 
            b.bill_type="月度" AND b.is_deleted=0 and b.statistical_year='2024' and b.statistical_month='06'`
        let bill = await db.query(sql)
        bill = bill[0]

        let sum = bill.length
        let i = 0

        for (const item of bill) {

            let body = {
                "service": "standard",
                "function": "xsearch",
                "stime": 1717171200,
                "etime": 1719676800,
                "uid": item.account_id,
                "contract_id": item.contract_id,
                "cid": 564
            }
            let header = {
                "accessToken": "9911b73d20da6615b4a013a1974e59c4"
            }

            let res = await axios.post('https://admin-dowding.istarshine.com/node-api/v1/log', body, { headers: header })
            res = res.data
          
            if(res.code ==1){
                continue;
            }

            let cycle_consumption = new Decimal(item.statistic_data.cycle_consumption).add(res.data.total).toFixed()
            let officialPrice = new Decimal(item.statistic_data.officialPrice).add(res.data.officialPrice).toFixed()
            let money_cycle = new Decimal(item.statistic_data.money_cycle).add(res.data.consumption).toFixed()
            let money_sum = new Decimal(item.statistic_data.money_sum).add(res.data.consumption).toFixed()
            let qk = new Decimal(money_sum).sub(item.statistic_data.money_refund).toFixed()

            let sql2 = `
                    update contract_bill set 
                        statistic_data=JSON_SET(statistic_data,'$.cycle_consumption','${cycle_consumption}'),
                        statistic_data=JSON_SET(statistic_data,'$.officialPrice','${officialPrice}'),
                        statistic_data=JSON_SET(statistic_data,'$.money_cycle','${money_cycle}'),
                        statistic_data=JSON_SET(statistic_data,'$.money_sum','${money_sum}'),
                        statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}')
                    where 
                        id=${item.id}
                `
            await db.query(sql2)
            console.log(item.id,res.data);
        }




        // for (const item of bill) {
        //     i++
        //     let sql1 = `select
        //     id,statistic_data->'$.money_cycle' as money_cycle,statistic_data->'$.money_sum' as money_sum,statistic_data->'$.money_refund' as money_refund,statistical_month
        //     from contract_bill 
        //     where 
        //     account_id=${item.account_id} and order_detail_id='${item.order_detail_id}' and bill_type="月度" AND is_deleted=0 and statistical_year='2024' and statistical_month in ('05','06') order by statistical_month asc`
        //     let bro = await db.query(sql1)
        //     bro = bro[0]

        //     if(bro.length!=2){continue}
        //     let money_sum = new Decimal(bro[0].money_sum).add(bro[1].money_cycle).toFixed()
        //     let qk = new Decimal(money_sum).sub(bro[1].money_refund).toFixed()

        //     let sql2 = `
        //             update contract_bill set 
        //                 statistic_data=JSON_SET(statistic_data,'$.money_sum','${money_sum}'),
        //                 statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}')
        //             where 
        //                 id=${bro[1].id}`
        //     await db.query(sql2)
        //     console.log(`进度${i}/${sum}`)
        // }




        // for (const item of bill) {
        //     let sql = `select id,statistic_data->'$.money_cycle' as money_cycle,statistic_data->'$.money_refund' as money_refund  from contract_bill where bill_type="月度" and is_deleted=0 and account_id='${item.account_id}' and order_detail_id='${item.order_detail_id}' order by id,statistical_year,statistical_month asc`
        //     let list = await db.query(sql)
        //     list = list[0]
        //     let lj = '0'
        //     for (const l of list) {

        //         if (l.money_cycle == null || l.money_cycle == "") {
        //             continue;
        //         }

        //         // 当月消费数据量
        //         let money_cycle
        //         if (l.money_cycle == null || l.money_cycle == "") {
        //             money_cycle = '0'
        //         } else {
        //             money_cycle = l.money_cycle
        //         }

        //         let money_refund

        //         if (l.money_refund == null || l.money_refund == "") {
        //             money_refund = '0'
        //         } else {
        //             money_refund = l.money_refund
        //         }

        //         lj = new Decimal(lj).add(money_cycle).toFixed()
        //         let qk = new Decimal(lj).sub(money_refund).toFixed()
        //         let sql1 = `
        //             update contract_bill set 
        //                 statistic_data=JSON_SET(statistic_data,'$.money_sum','${lj}'),
        //                 statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}'),
        //                 statistic_data=JSON_SET(statistic_data,'$.money_refund','${money_refund}')
        //             where 
        //                 id=${l.id}`

        //         await db.query(sql1)
        //     }
        //     console.log(item.account_id, item.order_detail_id);
        // }


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