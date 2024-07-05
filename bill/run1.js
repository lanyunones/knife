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
        let times = time.betweenDates('2023-01-01', '2023-04-21', 'YYYYMMDD')

        let dir = `${__dirname}/../bill.xlsx`
        const workbook = XLSX.readFile(dir);
        const sheetNames = workbook.SheetNames;
        const sheet = workbook.Sheets[sheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        let sum = data.length

        let i = 0

        let aim = []
        for (const item of data) {
            if (item["合同编号"] == "SJ2022112518" && item["账号"] == "13601035022") {
                aim.push(item)
            }
        }

        if (aim.length == 0) {
            console.log("未查询到有效账单");
            return
        }

        let lj = "0"
        for (const item of aim) {
           
            let sql1 = `select statistic_data->'$.money_cycle' as money_cycle,statistic_data->'$.money_refund' as money_refund  from contract_bill where id=${item["账单id"]}`
            let res = await db.query(sql1)
            res = res[0]

            let money_cycle = res[0].money_cycle ?? "0"
            let money_refund = res[0]?.money_refund ?? "0"


            lj = new Decimal(lj).add(money_cycle).toFixed() //累计消耗金额
            let qk = new Decimal(lj).sub(money_refund).toFixed()
            console.log(`${item["账单id"]},累计消费：${lj},累计冲值：${money_refund} 欠款：${qk}`)

            let sql = `
               update 
                   contract_bill 
               set 
                   statistic_data=JSON_SET(statistic_data,'$.money_sum','${lj}'),statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}')
               where 
                   id=${item["账单id"]}
               `
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