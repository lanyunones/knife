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

        let groupSql = `select id,contract_id,phone,aim_num,month_num from ly_bill where aim_num is not null and month_num-aim_num >= 0`
        let group = await db.query(groupSql)
        group = group[0]


        for (const g of group) {

            let sql = `select * from ly_bill where contract_id='${g.contract_id}' and phone='${g.phone}' order by id,year,month asc`
            let list = await db.query(sql)
            list = list[0]

            let lj = '0'
            for (const item of list) {
                let aim_num

                if (item.aim_num == null) {
                    aim_num = '0'
                } else {
                    aim_num = item.aim_num
                }

                let cha = item.month_num - item.aim_num //周期消耗量 - excel补偿量

                let money_cycle //周期消耗
                let giftsAmount //赠送金额

                if (cha >= 0) {
                    money_cycle = new Decimal(cha).mul(item.factor).toFixed() // 周期消耗金额= 周期消耗量-excel补偿量 * 实际单价
                    giftsAmount = new Decimal(aim_num).mul(item.factor).toFixed() // 抹零等于 excel补偿量
                    console.log("下面不用管了")
                } else {
                    console.log("异常计算", item.id)
                    return
                }

                lj = new Decimal(lj).add(money_cycle).toFixed()
                let qk = new Decimal(lj).sub(item.money_refund).toFixed()

                let sqlup = `
                update 
                    ly_bill 
                set 
                    money_cycle='${money_cycle}',money_sum='${lj}',money_debt='${qk}',giftsAmount='${giftsAmount}'
                where 
                    id=${item.id}
                `

                await db.query(sqlup)

            }
            console.log(g.id, g.contract_id, g.phone);
        }





    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();