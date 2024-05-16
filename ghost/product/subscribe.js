const { get, filter, sum } = require('lodash');
const { Decimal } = require('decimal.js')
const { subjectClient } = require('../logic/esClient.js')
const moment = require('moment')

// 订阅
async function subscribe(adb, contractId, uid, hashKey, env) {

    let sql = `select factor,ifnull(SUM(total),0) as dataSize from bill_subscribe where uid=${uid} and contract_id='${contractId}' `
    let res = await adb.mdb.query(sql)
    res = res[0]
    let dataSize = get(res, "[0]['dataSize']", 0)
    let factor = get(res, "[0]['factor']", null)

    if (dataSize == 0 || factor == null) {
        return false
    } else {
        let esResDataSize = await esResult(adb, uid, hashKey)
        let dataGroup = new Decimal(dataSize).add(esResDataSize).toFixed()
        let totalGroup = new Decimal(dataGroup).mul(factor).toFixed()
        return {
            onceGroup: dataGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup,
        }
    }
}



// 公共es 结果集
async function esResult(adb, uid, hashKey) {

    let r = "dowding:apisix:apiV2:contract:limit:daySize:" + uid + ":" + "subscribe" + ":" + Number(moment(new Date()).format("YYYYMMDD")) + ":" + hashKey
    return await adb.rdb.get(r)

    // let subjectId = await db.mdb.query(`SELECT account_id,subject_id FROM subscribe_subject WHERE account_id = ${uid} AND ((is_start = 1 AND is_deleted = 1) OR is_system = 0 )`)
    // subjectId = subjectId[0]

    // let fun = []

    // for (const item of subjectId) {
    //     fun.push(esRs(item.subject_id))
    // }
    // let total = 0
    // await Promise.all(fun).then((res) => {
    //     total = sum(res)
    // })
    // return total
}



// async function esRs(subjectId) {
//     let dsl = {
//         "track_total_hits": true,
//         "size": 0,
//         "query": {
//             "bool": {
//                 "filter": [
//                     {
//                         "term": {
//                             // 数据平台账号ID
//                             "puts": subjectId
//                         }
//                     }
//                 ]
//             }
//         }
//     }
//     let res = await subjectClient(dsl)
//     let dataSize = get(res, `["hits"]["total"]["value"]`, 0)
//     return dataSize
// }


module.exports = {
    subscribe
}    