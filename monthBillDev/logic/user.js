const { get, map, uniq } = require('lodash');
const { Decimal } = require('decimal.js')
const moment = require('moment');


async function users(db) {
    let lastMonth = moment().add(-1, 'months').startOf('months').format('x')
    try {
        let sql1 = `select account_id,order_detail_id from contract_detail where is_deleted=0 group by account_id,order_detail_id`
        let res = await db.query(sql1)
        res = res[0]
       
        let list = []
        for (let i = 0; i < res.length; i++) {
            let sql = `SELECT contract_id,contract_start,contract_end FROM contract where account_id=${res[i].account_id} and order_detail_id='${res[i].order_detail_id}' and account_id !=0 and contract_end > ${lastMonth}`
            let r = await db.query(sql)
            r = r[0]
            if (r.length > 0) {
                list.push({
                    aid: res[i].account_id,
                    order_detail_id: res[i].order_detail_id,
                    contract_id: r[0].contract_id,
                    contract_start: r[0].contract_start,
                    contract_end: r[0].contract_end
                })
            }
        }

        for (let item of list) {
            let sql1 = `select IFNULL(sum(amount),0) as total from api_recharged where contract_id='${item.contract_id}' and account_id = ${item.aid} and is_deleted=0 and type in (1,2,3,6)`
            let sql2 = `select IFNULL(sum(balance),0) as total from bill_supplement where contract_id='${item.contract_id}' and account_id =${item.aid}`
            let sql3 = `select sjpt_account_id from account where account_id=${item.aid}`
            
            await Promise.all([
                db.query(sql1),
                db.query(sql2),
                db.query(sql3)
            ]).then(r => {
                item.totalCharge = new Decimal(r[0][0][0].total).add(r[1][0][0].total).toFixed()
                item.sid = r[2][0][0]?.sjpt_account_id ?? ''
            })
        }
        return list
    } catch (error) {
        console.log(error);
        return []
    }
}


async function serviceList(db, account_id, order_id) {
    try {
        let sql = `SELECT service_class -> '$.label' as serviceName FROM contract_detail where account_id=${account_id} and order_detail_id='${order_id}'`
        let res = await db.query(sql)
        res = res[0]
        let serviceNames = map(res, 'serviceName')
        serviceNames = uniq(serviceNames)
        let serviceList = [] //服务与方法名映射
        serviceNames.forEach((item) => {
            let value
            switch (item) {
                case '数据服务':
                    value = 'standard';
                    break;
                case '互动数刷新':
                    value = 'interact';
                    break;
                case '评论刷新':
                    value = 'comment';
                    break;
                case '账号刷新':
                    value = 'account';
                    break;
                case '看板分析（普通）':
                    value = 'canvas';
                    break;
                case '看板分析（一年）':
                    value = 'canvasYear';
                    break;
                case '删帖检测':
                    value = 'del';
                    break;
                case '视频下载':
                    value = 'video';
                    break;
                case '指数':
                    value = 'index';
                    break;
                case '热榜':
                    value = 'hot';
                    break;
                case '舆情秘书标准数据API服务':
                    value = 'yqmsStandard';
                    break;
                case '舆情秘书统计分析API':
                    value = 'yqmsAnalyse';
                    break;
            }
            serviceList.push({ serviceName: item, functionName: value, list: {} })
        })
        return serviceList
    } catch (error) {
        return []
    }
}

// 用户合同总充值
async function moneyRefund(db, baseInfo) {
    try {
        let sql1 = `select IFNULL(SUM(amount),0) as total from api_recharged where contract_id='${baseInfo.contract_id}' and account_id = ${baseInfo.aid} and is_deleted=0 and type in (1,2,3,6)`
        let sql2 = `select IFNULL(SUM(balance),0) as total from bill_supplement where contract_id='${baseInfo.contract_id}' and account_id = ${baseInfo.aid} and order_detail_id= '${baseInfo.order_detail_id}'`
        let moneyRefund = '0'
        await Promise.all([
            db.query(sql1),
            db.query(sql2),
        ]).then(r => {
            moneyRefund = new Decimal(r[0][0][0].total).add(r[1][0][0].total).toFixed()
        })
        return moneyRefund
    } catch (error) {
        return "0"
    }

}


module.exports = {
    users,
    serviceList,
    moneyRefund
}    