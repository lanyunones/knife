const { get, filter } = require('lodash');
const { Decimal } = require('decimal.js')
const { subjectClient } = require('../logic/esClient.js')

// 订阅
async function subscribe(db, contractId, uid) {
    let sql = `select factor,ifnull(SUM(total),0) as dataSize from bill_subscribe where uid=${uid} and contract_id='${contractId}' `
    let res = await db.query(sql)
    res = res[0]
    let dataSize = get(res, "[0]['dataSize']", 0)
    let factor = get(res, "[0]['factor']", null)

    if (dataSize == 0 || factor == null) {
        return false
    } else {
        let esResDataSize = await esResult(uid)  
        let dataGroup=new Decimal(dataSize).add(esResDataSize).toFixed()
        let totalGroup=new Decimal(dataGroup).mul(factor).toFixed()
      
        return {
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}



// 公共es 结果集
async function esResult(uid) {
    let dsl = {
        "track_total_hits": true,
        "size": 0,
        "query": {
            "bool": {
                "filter": [
                    {
                        "term": {
                            // 数据平台账号ID
                            "puts_user": uid
                        }
                    }
                ]
            }
        }
    }
    let res = await subjectClient(dsl)
    let dataSize = get(res, `["hits"]["total"]["value"]`, 0)
    return dataSize
}



module.exports = {
    subscribe
}    