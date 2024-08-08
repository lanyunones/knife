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
        let sql=`select * from bill_move`
        let userList=await db.query(sql)
        userList=userList[0]
       
        for(const item of userList){
           let interface_name= await sdb.query(`select interface_name from sys_interface_status_es where token='${item.token}' GROUP BY interface_name`)
           interface_name=interface_name[0]
           
           console.log(item.aid,item.token,interface_name);
           
        }

    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();