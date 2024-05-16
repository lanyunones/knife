const db = require('mysql2');
const redis = require('../common/redis')
const _ = require('lodash');
const moment = require('moment');
const { Decimal } = require('decimal.js')
const execArgs = require('parse-script-args')
const path = require('path')
const mysqlRes = require('./mysqlRes.js')
const esRes = require('./esRes.js');
const { lock, unlock } = require('./lock.js');



/**
 *  真实log刷redis钱包
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

    // 用户盒子
    let userBox = []

    //全部用户
    let users
    users = await mysqlRes.allUserIds(db_dowding); //查询全部记账用户
    //9021894 专题用户

    /**
     * 处理用户ID: 9009850
        处理用户ID: 9021584
        处理用户ID: 9022162
     */
    //console.log(users);
    
    users = [
        9018458, 9009850, 9021584, 9022162,
        9019140, 9020219, 9021442, 9021708, 9012891,
        9020165, 9021279, 9021506, 9021320, 9017412,
        9020279, 9020562, 9021216, 9000464, 9000868,
        9002293, 9017071, 9020295, 9020534, 9020707,
        9020750, 9020901, 9021149, 9021178, 9021289,
        9021485, 9021504, 9021572, 9021611, 9021679,
        9021897, 9015249, 9019358, 9019926, 9021355,
        9020511, 9020811, 9020919, 9020962, 9022176,
        9021363, 9021659, 9021865
    ]

    try {
        //全部用户合同信息
        for (const uid of users) {
            let contrat = await mysqlRes.userContract(db_dowding, uid);
            userBox.push({ uid: uid, contract: contrat })
        }

        // mysql 账单
        for (let userInfo of userBox) {
            // mysql 账单
            userInfo = await mysqlRes.mysqlBill(db_dowding, userInfo)
        }


        // ES账单
        for (let userInfo of userBox) {
            // mysql 账单
            userInfo = await esRes.apisixBill(args.env, userInfo)

        }


        // 查询redis 并计算balance
        for (const userItem of userBox) {
            for (const item of userItem.contract) {
                if (item.amount != null) {
                    continue
                }
                await lock(rds, userItem.uid, item.hashkey)
                try {
                    //查询redis中余额
                    let banlance = new Decimal(item.amount).sub(item.mysqlCost).sub(item.esCost).toFixed()

                    //redis中余额
                    let redisBanlance = await rds.hget(`dowding:apisix:apiV2:contract:balance:${userItem.uid}`, item.hashkey)
                    if (_.isEmpty(redisBanlance)) {
                        continue
                    }
                    redisBanlance = JSON.parse(redisBanlance)
                    if (new Decimal(redisBanlance.balance).eq(banlance) === false) {
                        _.set(redisBanlance, 'balance', banlance)
                    }

                    await rds.hset(`dowding:apisix:apiV2:contract:balance:${userItem.uid}`, item.hashkey, JSON.stringify(redisBanlance))

                } finally {
                    // 释放锁
                    await unlock(rds, userItem.uid, item.hashkey)
                }
            }
            console.log("处理用户ID:", userItem.uid);
        }
    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }
}


run();