const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { betweenDates } = require('../common/time.js')
const factorReal = require('./logic/factorReal.js')
const { aim } = require('./logic/user.js')
const { xsearch } = require('./product/product.js')



/**
 *  数据平台账号sys_interface_status_es历史数据迁移
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
        let users = await db.query(`select * from bill_move where is_erreo=0`)
        users = users[0]
        for (const user of users) {
            let contract = await aim(db, user.aid)
            for (const c of contract) {
                let timeArr = betweenDates(c.contract_start, c.contract_end, 'YYYYMMDD')
                for (const time of timeArr) {
                    let timestr = moment(time).format('YYYY-MM-DD')
                    let userInfo={
                        time:time,
                        timestr:timestr,
                        token:user.token,
                        factor:c.factor,
                        uid:user.aid,
                        contract_id:c.contract_id
                    }
                   await xsearch(db,sdb,userInfo)
                   return
                }
                return
            }
            return
        }

    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();