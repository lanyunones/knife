const db = require('mysql2');
const redis = require('../common/redis')
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const axios = require('axios').default;


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
    let db_dowding = db.createPool(conf.mysql.dowding)
    db_dowding = db_dowding.promise()
    //实例化redis
    const rds = redis.dowding(args.env)

    try {
       


    } catch (error) {
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();