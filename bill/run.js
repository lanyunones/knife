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

        let i = 0

        let aim = []
        for (const item of data) {
            if (item["合同编号"] == "XD2023122230" && item["账号"] == "15610015553") {
                aim.push(item)
            }
        }

        if(aim.length == 0){
            console.log("未查询到有效账单");
            return
        }

        let sqldetail = `select practical_unit from contract_bill_detail where bill_id=${aim[0]["账单id"]}`
        let f = await db.query(sqldetail)
        f = f[0]
        f = f[0]?.practical_unit ?? '0.01'
        f = new Decimal(f).mul('10000000000').toFixed()

        let lj = "0"
        for (const item of aim) {
            console.log(item);
            let money_cycle = new Decimal(item["周期消耗量"]).mul(f).toFixed() //周期消耗金额
            lj = new Decimal(lj).add(money_cycle).toFixed() //累计消耗金额
            let qk = new Decimal(lj).sub(item["已还款金额"]).toFixed()
            
            let sql=`
            update 
                contract_bill 
            set 
                statistic_data=JSON_SET(statistic_data,'$.money_cycle','${money_cycle}'),statistic_data=JSON_SET(statistic_data,'$.money_sum','${lj}'),statistic_data=JSON_SET(statistic_data,'$.money_debt','${qk}')
            where 
                id=${item["账单id"]}
            `
            await db.query(sql)
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