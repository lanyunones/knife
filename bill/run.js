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
        let dir=`${__dirname}/../bill.xlsx`
        const workbook = XLSX.readFile(dir);
        const sheetNames = workbook.SheetNames;
        const sheet = workbook.Sheets[sheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        let sum=data.length
 
        let i=0
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