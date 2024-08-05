const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { betweenDates } = require('../common/time.js')
const factorReal = require('./logic/factorReal.js')

/**
 *  数据平台账号Xsearch 历史数据迁移
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

    let sdb = mysql.createPool(conf.mysql.sjpt)
    sdb = sdb.promise()

    try {
        let suid = 3378691311574016
        let uid = 9020864
        let contract_id = 'SJXD2023092720'
        let factor =new Decimal(new Decimal(10).pow(10)).mul('0.05').toFixed()
        let token = await sdb.query(`select * from sys_user_info where user_id=${suid}`)
        
        


        let timeArr = betweenDates('2023-09-10', '2024-08-02', 'YYYYMMDD')
        for (const time of timeArr) {
            let sql = `SELECT sum(total_amount) as total,info_flag FROM sys_interface_status_es where token='ce32aaa7-6f19-4317-9b7e-a755697d2b3d' and ct ='${time}' and info_flag in ('0101','0105','0109','02','03','04','06','07','11','17','21') GROUP BY info_flag`
            let res = await sdb.query(sql)
            let list = res[0]
            if (list.length == 0) {
                continue
            }

            let sql2 = `SELECT sum(total_amount) as total,info_flag FROM sys_interface_status_es where token='ce32aaa7-6f19-4317-9b7e-a755697d2b3d' and ct ='${time}' and info_flag in ('0101','0105','0109','02','03','04','06','07','11','17','21')`
            let res2 = await sdb.query(sql2)
            let total = res2[0][0].total



            let timestr = moment(time).format('YYYY-MM-DD')

            for (const item of list) {
                let number = new Decimal(item.total).mul(factor).toFixed()
                let sql = `insert into info_flag_bill 
                (stime,uid,contract_id,domain,flag,size,number)
                values
                ('${timestr}','${uid}','${contract_id}','xsearch','${item.info_flag}',${item.total},'${number}')
                `
                await db.query(sql)
            }

            let cnumber = new Decimal(total).mul(factor).toFixed()

            let sqlS = `insert into bill_search 
            (stime,uid,charge_deduct_number,charge_deduct_size,times,name,contract_id,text_size,charge_deduct_text_number)
            values
            ('${timestr}',${uid},${cnumber},${total},1,'xsearch','${contract_id}',${total},${cnumber})
            `
            await db.query(sqlS)

            console.log(timestr);
        }
    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();