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
        // 查询refund
        let sql = `SELECT * FROM bill_refund_cop where aid=9020707 and ctime >'2024-05-16 00:00:00'`
        let logs = await db_dowding.query(sql)
        logs = logs[0]
        
        for (const item of logs) {
            let url = `http://192.168.224.42:19201/dowding-logs-apisix-api-*/_search`
            let dsl1 = {
                "track_total_hits": true,
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "term": {
                                    "req_id": item.apisix_req_id
                                }
                            }
                        ]
                    }
                },
                "sort": {
                    "@timestamp": {
                        "order": "desc"
                    }
                },
                "size": 1
            }

            let option = {
                method: 'post',
                url: url,
                headers: { 'Content-Type': 'application/json' },
                data: dsl1
            }

            let esRes = await axios(option);

            let esindex=esRes.data.hits.hits[0]._index
            let esid=esRes.data.hits.hits[0]._id
           

            let textSize = item.output_text_number
            let videoSize = item.output_insvideo_number
            let textNumber = new Decimal(textSize).mul('12500000').toFixed()
            let videoNumber = new Decimal(videoSize).mul('12500000').mul(2).toFixed()
            let charge_deduct_size = new Decimal(textSize).add(videoSize).toNumber()
            let charge_deduct_number = new Decimal(textNumber).add(videoNumber).toFixed()

            let dsl = {
                "doc": {
                    "charge_deduct_size": charge_deduct_size,
                    "charge_deduct_number": charge_deduct_number,
                    "charge_deduct_text_size": textSize,
                    "charge_deduct_video_size": videoSize,
                    "charge_deduct_text_number": textNumber,
                    "charge_deduct_video_number": videoNumber,
                }
            }

            console.log(item.id);
            console.log(dsl);

        //     let option2 = {
        //         method: 'post',
        //         url: `http://192.168.224.42:19201/${esindex}/_update/${esid}`,
        //         headers: { 'Content-Type': 'application/json' },
        //         data: dsl
        //     }

        //    let a= await axios(option2);
           
          // console.log(a.status,item.id);

        }








    } catch (error) {
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();