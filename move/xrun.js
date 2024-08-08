const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { betweenDates } = require('../common/time.js')
const factorReal = require('./logic/factorReal.js')
const { dateAim } = require('./logic/user.js')
const { xsearch,vsearch,dsearch,dvsearch,wsearch,fsearch} = require('./product/product.js')



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
        let last =moment().subtract(1,'days').format('YYYY-MM-DD')

        let users = await db.query(`select * from bill_move where is_erreo=0 and aid=9020686 `) //and aid=9020686 
        users = users[0]
        for (const user of users) {
            let contract = await dateAim(db, user.aid)

            for (const c of contract) {
                let timeArr = betweenDates(last, last, 'YYYYMMDD')
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
                    await Promise.all([
                        xsearch(db,sdb,userInfo),
                        vsearch(db,sdb,userInfo),
                        dsearch(db,sdb,userInfo),
                        dvsearch(db,sdb,userInfo),
                        wsearch(db,sdb,userInfo),
                        fsearch(db,sdb,userInfo),
                    ])
                }
              console.log(`进度：${user.aid} ${c.contract_id} 时间范围：${c.contract_start} - ${c.contract_end}`);
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();