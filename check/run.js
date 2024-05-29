const mysql = require('mysql2');
const redis = require('../common/redis')
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { esClient } = require('./logic/esClient.js')


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


    try {

        let dsl = {
            "track_total_hits": true,
            "query": {
                "bool": {
                    "filter": [
                        {
                            "term": {
                                "uri": "/api/v3/kafka/task"
                            }
                        },
                        {
                            "term": {
                                "jwt_dd_aid": 9000620
                            }
                        },
                        {
                            "term": {
                                "req_env": "prod"
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
            "_source": {
                "includes": [
                    "charge_deduct_text_size",
                    "charge_deduct_video_size",
                    "charge_deduct_size",
                    "charge_deduct_text_number",
                    "charge_deduct_video_number",
                    "charge_deduct_number",
                    "charge_factor",
                    "charge_deduct_video_multiple",
                    "req_id"
                ]
            },
            "size": 1000,
            "aggs": {
                "dataSize": {
                    "sum": {
                        "field": "charge_deduct_size"
                    }
                },
                "textSize": {
                    "sum": {
                        "field": "charge_deduct_text_size"
                    }
                },
                "videoSize": {
                    "sum": {
                        "field": "charge_deduct_video_size"
                    }
                },
                "dataNumber": {
                    "sum": {
                        "field": "charge_deduct_number"
                    }
                },
                "textNumber": {
                    "sum": {
                        "field": "charge_deduct_text_number"
                    }
                },
                "videoNumber": {
                    "sum": {
                        "field": "charge_deduct_video_number"
                    }
                }
            }
        }
        let res = await esClient(dsl, '20240528')
        let list = res.hits.hits

        for (const item of list) {
            let charge_deduct_size = item["_source"]["charge_deduct_size"]
            let text_size = item["_source"]["charge_deduct_text_size"]
            let video_size = item["_source"]["charge_deduct_video_size"]
            let req_id = item["_source"]["req_id"]

            if (new Decimal(text_size).add(video_size).eq(charge_deduct_size)) {
                //console.log("数据正确")
            } else {
                console.log("数据错误req_id:", req_id)
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