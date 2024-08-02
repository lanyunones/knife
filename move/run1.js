const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { betweenDates } = require('../common/time.js')
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

        let timeArr = betweenDates('2024-08-01', '2024-08-01', 'YYYY-MM-DD')
        for (const time of timeArr) {
            let sql = `select * from info_flag_bill where stime='${time}' and flag!='ocr' and uid=9009850`
            let res = await db.query(sql)
            let list = res[0]

            for (const item of list) {
                let url = ''
                switch (item.domain) {
                    case 'search':
                        url = '/api/v3/consult/search'
                        break
                    case 'kafka':
                        url = '/api/v3/kafka/task'
                        break
                    case 'xsearch':
                        url = '/api/v3/xsearch'
                        break

                }   
                console.log(item.domain,url);

                //获取系数
                let factor = await factorReal.real(item.uid, item.contract_id, url)
                factor = factor.realFactor
                console.log(factor);
                let number= new Decimal(item.size).mul(factor).toFixed()
                
                let sql2=`update info_flag_bill set number=${number} where id=${item.id}`

                await db.query(sql2)
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();