const moment = require('moment');

let TimerIds = {}
let getLockTimeout = 10000

/**
 * 获取锁
 * @param {*} rds 
 * @param {*} accountId 
 * @param {*} key 
 */
async function lock(rds, accountId, key) {
    let currentTimestamp = Number(moment().format("x"))

    while (true) {
        
        if (Number(moment().format("x")) - currentTimestamp > getLockTimeout) {
            throw new Error('获取合同锁超时')
        }
        // 获取合同锁
        let lock = await rds.set(`dowding:apisix:apiV2:contract:locks:${accountId}:${key}`, '1', 'EX', '5', 'NX')
        if (lock === null) {
            await new Promise(resolve => setTimeout(resolve, 100))
            continue
        }
        break
    }

    // 创建锁定时器
    await createTimer(rds, accountId, key)
}


/**
* 释放锁
*/
async function unlock(rds, accountId, key) {
    // 销毁定时器
    await closeTimer(accountId, key)

    await rds.del(`dowding:apisix:apiV2:contract:locks:${accountId}:${key}`)
}


/**
 * 创建锁续命定时器
 * @param {*} rds 
 * @param {*} accountId 
 * @param {*} key 
 */
async function createTimer(rds, accountId, key) {
    let timerId = setInterval(async () => {
        await rds.expire(`dowding:apisix:apiV2:contract:locks:${accountId}:${key}`, 5)
    }, 4000)
    TimerIds[`${accountId}:${key}`] = String(timerId)
}



/**
 * 销毁锁续命定时器
 */
async function closeTimer(accountId, key) {
    clearInterval(TimerIds[`${accountId}:${key}`])
}



module.exports = {
    lock,
    unlock
}