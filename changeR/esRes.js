const client = require('./esClient.js')
const moment = require('moment');
const _ = require('lodash');
const { Decimal } = require('decimal.js')
/**
 * apisix 聚合所有用户当天的数据 charge_deduct_number（条数金额） charge_deduct_once_number（次数金额）
 * @param {*} env 
 */
async function apisixBill(env = 'prod', userInfo) {
    
    //当天日期
    let date = moment().format('YYYYMMDD');

    //dsl
    let dsl = {
        "track_total_hits": true,
        "query": {
            "bool": {
                "filter": [
                    {
                        "term": {
                            "req_env": env
                        }
                    },
                    {
                        "term": {
                            "jwt_dd_aid": userInfo.uid
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
        "size": 0,
        "aggs": {
            "contract": {
                "terms": {
                    "field": "charge_contract_id"
                },
                "aggs": {
                    "number": {
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
        }
    }
    //查询
    let esRes = await client.esClient(date, dsl)
    let buckets = _.get(esRes, "aggregations.contract.buckets", [])
    
    //条数金额+次数金额
    for(let item of userInfo.contract){
        item.esCost='0'
        for(let ite of buckets){
            if(item.contract_id ===ite.key){
                item.esCost=new Decimal(ite.number.value).add(ite.onceNumber.value).toFixed()
            }
        }
    }

    return userInfo
}


module.exports = {
    apisixBill
}