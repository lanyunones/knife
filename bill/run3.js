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
        let val = 30000000
        let id = 3107



        let sql2 = `select practical_unit,cycle_consumption from contract_bill_detail where bill_id=${id}`
        let res = await db.query(sql2)
        res = res[0]

        let factor
        if (res[0]?.practical_unit == undefined || res[0]?.practical_unit == null || res[0]?.practical_unit == "") {
            factor = new Decimal('0.01').mul('10000000000').toFixed()
        } else {
            factor = new Decimal(res[0]?.practical_unit).mul('10000000000').toFixed()
        }

        //周期消耗量
        let cycle_consumption = res[0]?.cycle_consumption
        let cha = cycle_consumption - val //周期消耗量 - excel补偿量

        let money_cycle //周期消耗
        let giftsAmount //赠送金额


        if (cha <= 0) {
            money_cycle = "0" // 周期消耗金额=0
            giftsAmount = new Decimal(cycle_consumption).mul(f).toFixed()  //赠送金额=周期消耗量 * 实际单价
            console.log(`下一个继续扣除${Math.abs(cha)}`)
        } else {
            money_cycle = new Decimal(cha).mul(factor).toFixed() // 周期消耗金额= 周期消耗量-excel补偿量 * 实际单价
            giftsAmount = new Decimal(val).mul(factor).toFixed() // 抹零等于 excel补偿量
            console.log("下面不用管了")
        }

        let total = new Decimal(cycle_consumption).mul(factor).toFixed()
        let total2 = new Decimal(money_cycle).add(giftsAmount).toFixed()

        if (new Decimal(total).eq(new Decimal(total2))) {
            let sql = `
            update 
                contract_bill 
            set 
                statistic_data=JSON_SET(statistic_data,'$.money_cycle','${money_cycle}'),statistic_data=JSON_SET(statistic_data,'$.giftsAmount','${giftsAmount}')
            where 
                id=${id}
            `
            await db.query(sql)
        } else {
            console.log("计算错误")
        }


    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();