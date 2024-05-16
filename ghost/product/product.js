const { get, filter } = require('lodash');
const { Decimal } = require('decimal.js')
const { esClient } = require('../logic/esClient.js')
const { contractApi } = require('../logic/contract.js')

//总产品
async function overview(db, contractId, uid, env) {
    let productList = {
        consult: {},
        canvas: {},
        canvasYears: {},
        comment: {},
        interact: {},
        account: {},
        index: {},
        video: {},
        hot: {},
        yqms: {}
    }
    await Promise.all([
        consult(db, contractId, uid, env),
        canvas(db, contractId, uid, env),
        canvasYears(db, contractId, uid, env),
        comment(db, contractId, uid, env),
        interact(db, contractId, uid, env),
        account(db, contractId, uid, env),
        index(db, contractId, uid, env),
        video(db, contractId, uid, env),
        hot(db, contractId, uid, env),
        yqms(db, contractId, uid, env),
    ]).then((res) => {
        [productList.consult, productList.canvas, productList.canvasYears, productList.comment, productList.interact, productList.account, productList.index, productList.video, productList.hot, productList.yqms] = res
    })

    let box={}
    for (const i in productList) {
        if(productList[i]){
            box[i]=productList[i]
        }
    }
    return box
}


// 公共mysql 结果集
async function publicResult(tableName, db, contractId, uid, where = []) {
    where.push(`uid=${uid}`, `contract_id='${contractId}'`)

    let sql = `
        select
          ifnull(sum(times),0) as onceGroup, ifnull(sum(charge_deduct_size),0) as dataGroup, ifnull(sum(charge_deduct_number + charge_deduct_once_number),0) as totalGroup
        from 
           ${tableName}
        where
           ${where.join(' and ')}
    `
    let res = await db.query(sql)
    res = res[0]

    let onceGroup = get(res, "[0]['onceGroup']", 0)
    let dataGroup = get(res, "[0]['dataGroup']", 0)
    let totalGroup = get(res, "[0]['totalGroup']", 0)
    return {
        dataGroup: dataGroup,
        onceGroup: onceGroup,
        totalGroup: totalGroup,
    }
}


// 公共es 结果集
async function publicEs(contractId, uid, env, urls) {
    let dsl = {
        "track_total_hits": true,
        "size": 0,
        "query": {
            "bool": {
                "filter": [
                    {
                        "terms": {
                            "uri": urls
                        }
                    },
                    {
                        "term": {
                            "req_env": env
                        }
                    },
                    {
                        "term": {
                            "jwt_dd_aid": uid
                        }
                    },
                    {
                        "term": {
                            "charge_contract_id": contractId
                        }
                    },
                    {
                        "term": {
                            "is_charge": 1
                        }
                    },
                    {
                        "term": {
                            "resp_status": 200
                        }
                    },
                    {
                        "term": {
                            "resp_body_code": 200
                        }
                    }
                ]
            }
        },
        "aggs": {
            "dateSize": {
                "sum": {
                    "field": "charge_deduct_size"
                }
            },
            "dataNumber": {
                "sum": {
                    "field": "charge_deduct_number"
                }
            },
            "onceNumber": {
                "sum": {
                    "field": "charge_deduct_once_number"
                }
            }
        }
    }
    let res = await esClient(dsl)
    let onceGroup = get(res, `["hits"]["total"]["value"]`, 0)
    let dataGroup = get(res, `["aggregations"]["dateSize"]["value"]`, 0)
    let totalGroup = new Decimal(get(res, `["aggregations"]["dataNumber"]["value"]`, 0)).add(get(res, `["aggregations"]["onceNumber"]["value"]`, 0)).toFixed()
    return {
        onceGroup: onceGroup,
        dataGroup: dataGroup,
        totalGroup: totalGroup
    }
}


// 搜索
async function consult(db, contractId, uid, env) {
    let mysqlRes = await publicResult("bill_search", db, contractId, uid)
    let urls = ["/api/v3/consult/search", "/api/v3/consult/total", "/api/v3/kafka/task"]
    let esRes = await publicEs(contractId, uid, env, urls)
    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)
    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}


// 看板
async function canvas(db, contractId, uid, env) {
    let urls = await contractApi(db, "canvas")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_canvas", db, contractId, uid, [`type='sync'`])
    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }

    }
}


// 看板年
async function canvasYears(db, contractId, uid, env) {
    let urls = await contractApi(db, "canvasYear")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_canvas", db, contractId, uid, [`type='async'`])

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}


// 互动
async function interact(db, contractId, uid, env) {
    let urls = await contractApi(db, "interact")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_interact", db, contractId, uid)

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}

// 评论
async function comment(db, contractId, uid, env) {
    let urls = await contractApi(db, "comment")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_comment", db, contractId, uid)

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}

// 账号
async function account(db, contractId, uid, env) {
    let urls = await contractApi(db, "account")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_account", db, contractId, uid)

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}

// 星光指数
async function index(db, contractId, uid, env) {
    let urls = await contractApi(db, "index")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_index", db, contractId, uid)
    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}

// 视频
async function video(db, contractId, uid, env) {
    let urls = await contractApi(db, "video")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_video", db, contractId, uid)

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}

// 热榜
async function hot(db, contractId, uid, env) {
    let urls = await contractApi(db, "hot")
    let esRes = await publicEs(contractId, uid, env, urls)
    let mysqlRes = await publicResult("bill_hot", db, contractId, uid)

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}

// 舆情秘书
async function yqms(db, contractId, uid, env) {
    let urls = await contractApi(db, "yqmsStandard")
    let urls2 = await contractApi(db, "yqmsAnalyse")
    let esRes = await publicEs(contractId, uid, env, urls)
    let esRes2 = await publicEs(contractId, uid, env, urls2)
    let mysqlRes = await publicResult("bill_yqms", db, contractId, uid)

    let onceGroup = new Decimal(mysqlRes.onceGroup).add(esRes.onceGroup).add(esRes2.onceGroup).toFixed()
    let dataGroup = new Decimal(mysqlRes.dataGroup).add(esRes.dataGroup).add(esRes2.onceGroup).toFixed()
    let totalGroup = new Decimal(mysqlRes.totalGroup).add(esRes.totalGroup).add(esRes2.totalGroup).toFixed()
    let check = new Decimal(onceGroup).add(dataGroup).add(totalGroup).eq(0)

    if (check) {
        return false
    } else {
        return {
            onceGroup: onceGroup,
            dataGroup: dataGroup,
            totalGroup: totalGroup
        }
    }
}


module.exports = {
    overview
}