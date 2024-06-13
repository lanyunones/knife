const moment = require('moment');
const axios = require('axios').default;
const JSONbigString = require('json-bigint')({ storeAsString: true });


async function esErrorClient(esQuery,date='') {
    //当天日期
    if(date ==''){
        date=moment().format('YYYYMMDD');
    }

    for (let i = 0; i < 5; i++) {
        try {
            let option = {
                method: 'post',
                url: `http://dowding_log_reader:00031CDF1DB62658A5B143B5265B1EFF@192.168.225.108:6668/dowding-apisix-error-log-${date}/_search`,
                params: {
                    ignore_unavailable: true,
                    timeout: '120s'
                },
                timeout: 0,
                responseType: 'stream',
                maxContentLength: Number.MAX_SAFE_INTEGER,
                maxBodyLength: Number.MAX_SAFE_INTEGER,
                headers: { 'Content-Type': 'application/json' },
                data: esQuery
            }
            let res = await axios(option);

            let responseData = ''

            const stream = res.data

            stream.on('data', data => {
                responseData += data.toString()
            })

            await new Promise((resolve) => {
                stream.on('end', () => {
                    resolve()
                })
            })

            return JSONbigString.parse(responseData);
        } catch (error) {
            console.log(error);
            if (error.response.status === 408 && i < 4) {
                await sleep(8000)
                console.log(`查询dowding_xgks_rt_log_${indexDate}重试次数${i}`);
            } else {
                throw new Error(error.toString())
            }
        }
    }
}


async function logClient(esQuery,date='') {
    //当天日期
    if(date ==''){
        date=moment().format('YYYYMMDD');
    }

    for (let i = 0; i < 5; i++) {
        try {
            let option = {
                method: 'post',
                url: `http://192.168.224.42:19201/dowding-logs-apisix-api-${date}/_search`,
                params: {
                    ignore_unavailable: true,
                    timeout: '120s'
                },
                timeout: 0,
                responseType: 'stream',
                maxContentLength: Number.MAX_SAFE_INTEGER,
                maxBodyLength: Number.MAX_SAFE_INTEGER,
                headers: { 'Content-Type': 'application/json' },
                data: esQuery
            }
            let res = await axios(option);

            let responseData = ''

            const stream = res.data

            stream.on('data', data => {
                responseData += data.toString()
            })

            await new Promise((resolve) => {
                stream.on('end', () => {
                    resolve()
                })
            })

            return JSONbigString.parse(responseData);
        } catch (error) {
            console.log(error);
            if (error.response.status === 408 && i < 4) {
                await sleep(8000)
                console.log(`查询dowding_xgks_rt_log_${indexDate}重试次数${i}`);
            } else {
                throw new Error(error.toString())
            }
        }
    }
}


async function updateEs(index, id, esQuery) {
    try {
        let option = {
            method: 'post',
            url: `http://192.168.224.42:19201/${index}/_update/${id}`,
            headers: { 'Content-Type': 'application/json' },
            data: esQuery
        }
        let res = await axios(option);
        return res.status
    } catch (error) {
        console.log(error);
        return 404
    }
}


module.exports = {
    esErrorClient,
    logClient,
    updateEs
}