const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { betweenDates } = require('../common/time')
const factorReal = require('./logic/factorReal.js')

/**
 * bill_xvs_search 迁移 bill_search
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

        let timeArr = betweenDates('2024-07-18', '2024-07-30', 'YYYY-MM-DD')
        for (const time of timeArr) {
            let sql = `select * from bill_xvs_search where stime='${time}'`
            let res = await db.query(sql)
            let list = res[0]
            for (const item of list) {
                let sql = `select account_id from account where sjpt_account_id=${item.uid} limit 1 `
                let account = await db.query(sql)
                account = account[0]
                if (account.length == 0) {
                    continue
                }
                aid = account[0]?.account_id
                let sql2 =`select contract_id from contract where account_id=${aid} and contract_start <= '${moment(item.stime).format('x')}' and contract_end >= '${moment(item.stime).format('x')}' limit 1`
                let contract = await db.query(sql2)
                contract=contract[0]
                if (contract.length == 0) {
                    continue
                }
                let contract_id=contract[0]?.contract_id ?? ''
                let name=''
                let url=''
                switch (item.name) {
                    case '/xsearch':
                        name = 'xsearch'
                        url='/api/v3/xsearch'
                        break
                    case '/vsearch':
                        name = 'vsearch'
                        url='/api/v3/vsearch'
                        break
                    case '/v1/search':
                        name = 'v1search'
                        url='/api/v3/v1/search'
                        break
                    case '/sliceSearch':
                        name = 'sliceSearch'
                        url='/api/v3/sliceSearch'
                        break

                }

                //获取系数
                let factor=await factorReal.real(aid,contract_id,url)
                factor=factor.realFactor

                let insert={
                    "stime": item.stime,
                    "uid":aid,
                    "charge_deduct_number":new Decimal(item.charge_deduct_size).mul(factor).toNumber(),
                    "charge_deduct_size":item.charge_deduct_size,
                    "name":name,
                    "contract_id":contract_id,
                    "text_size":item.charge_deduct_size,
                    "charge_deduct_text_number":new Decimal(item.charge_deduct_size).mul(factor).toNumber(),
                    "times":item.times,
                }
                let sql3 = `insert into bill_search_m (stime,uid,charge_deduct_number,charge_deduct_size,name,contract_id,text_size,charge_deduct_text_number,times)
                    values
                    ('${insert.stime}',${insert.uid},${insert.charge_deduct_number},${insert.charge_deduct_size},'${insert.name}','${insert.contract_id}',${insert.text_size},${insert.charge_deduct_text_number},${insert.times})
                `
                await db.query(sql3)
            }
            console.log(time);
        }
    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();