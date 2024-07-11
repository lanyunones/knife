const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')



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

    let sdb = mysql.createPool(conf.mysql.sjpt)
    sdb = sdb.promise()


    try {
        let sql = `SELECT account_id,login_entity FROM account where sjpt_account_id is null`
        let res = await db.query(sql)
        let dUsers = res[0]
      
        let sum=dUsers.length

        let i=0
        for(let item of dUsers){
            i++
            let sql = `SELECT id FROM sys_user where mobile='${item.login_entity}' limit 1`
            let sUser = await sdb.query(sql)
            sUser=sUser[0][0]?.id

            if(sUser == undefined){
                continue
            }

            await db.query(`update account set sjpt_account_id=${sUser} where account_id=${item.account_id}`)
           
            console.log(`${i}/${sum}`)
        }




    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();