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

        let groupSql = `select contract_id,phone from ly_bill group by contract_id,phone`
        let group = await db.query(groupSql)
        group = group[0]
        let sum = group.length

        //group = [{ contract_id: 'HFS20230703001', phone: '18905911106' }]

        let i = 0
        for (const g of group) {
            i++
            let sql = `select * from ly_bill where contract_id='${g.contract_id}' and phone='${g.phone}' order by id,year,month asc`
            let list = await db.query(sql)
            list = list[0]

            let lj = '0'
            let ljcha = 0
            for (const item of list) {
                // 当月赠送数据量
                let aim_num
                if (item.aim_num == null) {
                    aim_num = 0
                } else {
                    aim_num = Number(item.aim_num)
                }

                // 一次性抵扣数据量
                let add
                if (item.month_num_add == null) {
                    add = 0
                } else {
                    add = Number(item.month_num_add)
                }

                // 当月消费数据量
                let month_num = Number(item.month_num) + add

                cha = month_num - aim_num - ljcha //周期消耗量 - excel补偿量


                //console.log(`账单ID：${item.id};合同ID：${item.contract_id};手机号：${item.phone};当月消耗：${month_num};当月补偿：${aim_num};差值：${cha};剩余补偿：${ljcha};`);


                let money_cycle //周期消耗
                let giftsAmount //赠送金额

                if (cha >= 0) {
                    money_cycle = new Decimal(cha).mul(item.factor).toFixed() // 周期消耗金额= 周期消耗量-excel补偿量 * 实际单价
                    giftsAmount = new Decimal(aim_num).add(ljcha).mul(item.factor).toFixed() // 抹零等于 excel补偿量
                } else {
                    money_cycle = '0'
                    giftsAmount = new Decimal(month_num).mul(item.factor).toFixed()
                }

                if (cha >= 0) {
                    ljcha = 0
                } else {
                    ljcha = Math.abs(cha)
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
            console.log(g.contract_id, g.phone);
            console.log(`进度${i}/${sum}`)
        }

    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();