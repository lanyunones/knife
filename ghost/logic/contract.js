const { get,map } = require('lodash');
const { Decimal } = require('decimal.js')
//获取用户总充值
async function userRecharge(db, contractId, uid) {
    try {
        let sql = `select amount from api_recharged where contract_id='${contractId}' and account_id = ${uid} and is_deleted=0`
        let res = await db.query(sql)
        res = res[0]
        let total='0'
        for(const i of res) {
            total=new Decimal(total).add(new Decimal(i.amount)).toFixed()
        }
        return total
    } catch (error) {
        throw new Error('获取用户总充值失败' + error)
    }
}


//所有服务API
async function contractApi(db, service) {
    let res = await db.query(`select url from contract_api where service='${service}' and level=3`)
    res=res[0]
    let urls = map(res,'url')
    return urls
}


//用户合同api列表
async function userApis(db, contractId,uid) {
    let res = await db.query(`select url from api_contract_select where contract_id='${contractId}' and account_id=${uid} and is_selected=1 and api_status=0 group by url`)
    res=res[0]
    let urls = map(res,'url')
    return urls
}


module.exports = {
    userRecharge,
    contractApi,
    userApis
}    