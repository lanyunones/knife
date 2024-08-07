const { get, map, uniq } = require('lodash');
const { Decimal } = require('decimal.js')
const moment = require('moment');



async function aim(db, uid) {
    try {
        let sql1 = `select account_id,order_detail_id,practical_unit from contract_detail where account_id=${uid} and service_class->'$.value'=1 and is_deleted=0`
        let res = await db.query(sql1)
        res = res[0]
        let list = []
        for (let i = 0; i < res.length; i++) {
            let sql = `SELECT contract_id,contract_start,contract_end FROM contract where account_id=${res[i].account_id} and order_detail_id='${res[i].order_detail_id}' and account_id !=0`
            let r = await db.query(sql)
            r = r[0]
            if (r.length > 0) {
                list.push({
                    order_detail_id: res[i].order_detail_id,
                    contract_id: r[0].contract_id,
                    contract_start: moment(Number(r[0].contract_start)).format('YYYY-MM-DD'),
                    contract_end: moment(Number(r[0].contract_end)).format('YYYY-MM-DD'),
                    factor:new Decimal(res[i].practical_unit).mul(new Decimal(10).pow(10)).toFixed()
                })
            }
        }
        return list
    } catch (error) {
        return []
    }
}



module.exports = {
    aim
}    