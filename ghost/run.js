const db = require('mysql2');
const redis = require('../common/redis')
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { lock, unlock } = require('../common/redisLock');
const { overview } = require('./product/product.js');
const { subscribe } = require('./product/subscribe.js');
const { userRecharge, userApis } = require('./logic/contract.js');
const { log } = require('console');

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

    const adb = { mdb: db_dowding, rdb: rds }

    try {
        //redis所有用户
        let redisUsers = await rds.keys(`dowding:apisix:apiV2:contract:balance:9000620`)

        if (redisUsers.length == 0) {
            console.log(`redis没用该用户`);
        }

        for (const i of redisUsers) {
            let strS = i.split(':');
            let uid = strS[5];
            let hash = await rds.hgetall(i)
            for (const obj in hash) {

                let balanceInfo = JSON.parse(hash[obj])
                let hashKey = obj

                let userTotalRecharge = await userRecharge(db_dowding, balanceInfo.id, uid)  //总充值

                if (userTotalRecharge == 0 || userTotalRecharge == null) {
                    console.log(`用户ID:${uid},的合同hashKey:${hashKey},合同ID:${balanceInfo.id}没有充值金额，跳过`);
                    continue;
                }

                let userApi = []           //用户合同约定API服务
                let productList = {}       //用户服务账单明细

                await Promise.all([
                    userApis(db_dowding, balanceInfo.id, uid),              //用户API列表
                    overview(db_dowding, balanceInfo.id, uid, args.env),    //用户服务
                    subscribe(adb, balanceInfo.id, uid, hashKey, args.env)  //用户专题服务
                ]).then((res) => {
                    let subject
                    [userApi, productList, subject] = res
                    if (subject) {
                        productList['subscribe'] = subject
                    }
                })

                let useTotalGroup = {}
                let usageOnceGroup = {}
                let usageDataGroup = {}
                let useTotal = '0'
                for (const key in productList) {
                    useTotalGroup[key] = productList[key].totalGroup ?? '0'
                    usageOnceGroup[key] = productList[key].onceGroup ?? '0'
                    usageDataGroup[key] = productList[key].dataGroup ?? '0'
                    useTotal = new Decimal(useTotal).add(productList[key].totalGroup).toFixed()
                }
                // console.log(useTotalGroup);
                // console.log(usageOnceGroup);
                // console.log(usageDataGroup);
                // console.log(useTotal);

                balanceInfo.apis = userApi
                balanceInfo.useTotalGroup = useTotalGroup
                balanceInfo.usageOnceGroup = usageOnceGroup
                balanceInfo.usageDataGroup = usageDataGroup
                balanceInfo.useTotal = useTotal
                balanceInfo.balance = new Decimal(userTotalRecharge).sub(useTotal).toFixed()

                //加锁
                await lock(rds, uid, hashKey)
                try {
                    await rds.hset(`dowding:apisix:apiV2:contract:balance:${uid}`, hashKey, JSON.stringify(balanceInfo))
                } catch (error) {
                    console.log('写入失败', error)
                } finally {
                    // 释放锁
                    await unlock(rds, uid, hashKey)
                }

                console.log(`用户ID:${uid},合同hashkey:${hashKey},合同id:${balanceInfo.id}写入成功`);
            }
        }
    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();