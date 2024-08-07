const path = require('path')
const { get } = require('lodash');
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { esErrorClient, logClient, updateEs } = require('./logic/esClient.js')


/**
 * 处理合同退费异常
 */
let run = async function () {

    let dsl = {
        "size": 5000,
        "track_total_hits": true,
        "sort": [
            {
                "@timestamp": {
                    "order": "asc"
                }
            }
        ],
        "_source": { "include": ["message"] },
        "query": {
            "bool": {
                "must": [
                    {
                        "match_phrase": { "message": "合同退费异常" }
                    }
                ]
            }
        }
    }
    let res = await esErrorClient(dsl)

    let list = get(res, "hits.hits", [])
    let r = new RegExp(/\[request_id: (.+)\].+\u9000\u8d39\u8be6\u60c5\u003a\s(\{.+\})/)
    let log_time_r = new RegExp(/^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/)

    let leg = 1
    for (const item of list) {
        let log_time = item._source.message.match(log_time_r)
        log_time = String(log_time[0]).replace(/\//g, '-')
        log_time = moment(log_time).add(8, 'hour').format('YYYY-MM-DD HH:mm:ss')

        let reg = item._source.message.match(r)
        let reqid = reg[1]

        let dsl = {
            "query": {
                "bool": {
                    "filter": [
                        {
                            "term": {
                                "req_id": reqid
                            }
                        }
                    ]
                }
            }
        }
        let res = await logClient(dsl)
        let info = get(res, "hits.hits[0]", [])
        let id = get(info, "_id", "")
        let index = get(info, "_index", "")

        let multiple = info['_source'].charge_deduct_video_multiple
        let factor = info['_source'].charge_factor
        let onceFactor = info['_source'].charge_once_factor

        let once = Number(info['_source'].charge_deduct_once)
        let onceNumber = new Decimal(once).mul(onceFactor).toFixed()
        let videoSize = Number(info['_source'].charge_deduct_video_size)
        let textSize = Number(info['_source'].charge_deduct_size) - videoSize
        let textNumber = new Decimal(textSize).mul(factor).toFixed()
        let videoNumber = new Decimal(videoSize).mul(factor).mul(multiple).toFixed()
        let TotalNumber = new Decimal(textNumber).add(videoNumber).toFixed()


        let updsl = {
            "doc": {
                "charge_deduct_once_number": onceNumber,
                "charge_deduct_number": TotalNumber,
                "charge_deduct_text_size": textSize,
                "charge_deduct_video_size": videoSize,
                "charge_deduct_text_number": textNumber,
                "charge_deduct_video_number": videoNumber,
            }
        }

        if (info['_source'].resp_body_code != '200') {
            updsl = {
                "doc": {
                    "charge_deduct_once_number": '0',
                    "charge_deduct_number": '0',
                    "charge_deduct_text_size": 0,
                    "charge_deduct_video_size": 0,
                    "charge_deduct_text_number": '0',
                    "charge_deduct_video_number": '0',
                }
            }
        }


        await updateEs(index, id, updsl)
        console.log(`处理异常日志进度${leg}/${list.length}`)
        leg++
    }
}


run().catch(e => {
    console.log(e);
}).finally(() => {
    process.exit()
})