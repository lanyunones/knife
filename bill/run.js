const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const XLSX = require('xlsx');
const { log } = require('console');


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
        let dir = `${__dirname}/../bill.xlsx`
        const workbook = XLSX.readFile(dir);
        const sheetNames = workbook.SheetNames;
        const sheet = workbook.Sheets[sheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        let sum = data.length



        // let aim = []
        // for (const item of data) {
        //     if (item["合同编号"] == "SJ2022112518" && item["账号"] == "13601035022") {
        //         aim.push(item)
        //     }
        // }

        // if (aim.length == 0) {
        //     console.log("未查询到有效账单");
        //     return
        // }


        let i = 0
        for (const item of data) {
            i++
            let sqldetail = `select practical_unit from contract_bill_detail where bill_id=${item["账单id"]} and service_class->'$.value'=1 limit 1`
            let f = await db.query(sqldetail)
            f = f[0]

            if (f[0]?.practical_unit == undefined || f[0]?.practical_unit == null || f[0]?.practical_unit == "" || f[0]?.practical_unit == "无") {
                f = new Decimal('0.01').mul('10000000000').toFixed()
            } else {
                f = new Decimal(f[0]?.practical_unit).mul('10000000000').toFixed()
            }

            let sql1 = `select statistic_data->'$.money_cycle' as money_cycle,statistic_data->'$.money_refund' as money_refund  from contract_bill where id=${item["账单id"]}`
            let res = await db.query(sql1)
            res = res[0]
            let money_refund = res[0]?.money_refund ?? "0"
            //let money_cycle = new Decimal(item["周期消耗量"]).mul(f).toFixed() //周期消耗金额
            // lj = new Decimal(lj).add(money_cycle).toFixed() //累计消耗金额
            // let qk = new Decimal(lj).sub(item["已还款金额"]).toFixed()

            // let sql = `
            // update 
            //     contract_bill 
            // set 
            //     statistic_data=JSON_SET(statistic_data,'$.money_cycle','${money_cycle}'),statistic_data=JSON_SET(statistic_data,'$.money_sum','${lj}')
            // where 
            //     id=${item["账单id"]}
            // `

            let sql = `insert into ly_bill 
                (id,contract_id,phone,cname,year,month,month_num,factor,money_refund)
                values
                (${item["账单id"]},'${item["合同编号"]}','${item["账号"]}','${item["客户名称"]}',${item["年"]},${item["月"]},${item["周期消耗量"]},'${f}','${money_refund}')
            `
            await db.query(sql)

            console.log(`进度 ${i}/${sum}`)
        }



        // for(const item of data){
        //     i++
        //     let officialPrice=new Decimal(item["周期消耗量"]).mul(f).toFixed()
        //     let sql=`update contract_bill set statistic_data=JSON_SET(statistic_data,'$.officialPrice','${officialPrice}') where id=${item["账单id"]}`
        //     await db.query(sql)
        //     console.log(`${i}/${sum}`)
        // }




    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();