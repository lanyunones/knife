const { map } = require('lodash')
const factorReal = require('../logic/factorReal.js')
const { Decimal } = require('decimal.js')
const { info } = require('../logic/insert.js')

// 查询子服务
async function child(db, baseInfo) {
    try {
        let sql = `select service_api from contract_detail where account_id=${baseInfo.aid} and order_detail_id='${baseInfo.order_detail_id}' and service_class->'$.value'=7`
        let thirdChild = await db.query(sql)
        thirdChild = thirdChild[0]
        let apis = []
        for (const item of thirdChild) {
            for (const i of item.service_api) {
                apis.push(i.value)
            }
        }
        let apiFunctionName = await db.query(`select service_consume from contract_api where id in (${apis.join(',')})`)
        apiFunctionName = apiFunctionName[0]
        apiFunctionName = map(apiFunctionName, 'service_consume')
        return apiFunctionName
    } catch (error) {
        return []
    }
}


const fucntionClass = {
    // 系数标准系数与实际系数
    async factor(db, baseInfo, serviceUrl, fid, source='') {
        try {
            //标准系数
            let sql = `select IFNULL(config->'$.standard_unit','0.01') as factor from contract_api where service='hot' and level=2 and id=${fid}`
            let standardFactor = await db.query(sql)
            standardFactor = new Decimal(standardFactor[0][0].factor).mul(new Decimal(10).pow(10)).toFixed()
            // 实际系数
            let realFactor = await factorReal.real(baseInfo.aid, baseInfo.contract_id, serviceUrl, source)
            return { standardFactor: standardFactor, realFactor: realFactor.realFactor }
        } catch (error) {
            return { standardFactor: '100000000', realFactor: '100000000' }
        }
    },
    async rank(db, baseInfo){
        let list = {
            serviceName: "热榜",                //一级服务
            serviceType: "实时热榜",           //二级服务
            dataNumber: '0',                    //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                 //官方价
            discountAmount: "0",                //优惠价
            giftsAmount: "0",                   //抹零价
            realAmount: "0",                    //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api/v3/hot/rank', 108)
            let sql1 = `select IFNULL(sum(times),0) as total from bill_hot where domain='rank' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_hot where domain='rank' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber = res[1][0][0].total
                list.officialPrice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.discountAmount = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.giftsAmount = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.realAmount = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor=factor.standardFactor
                list.realFactor=factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async search(db, baseInfo){
        let list = {
            serviceName: "热榜",                //一级服务
            serviceType: "历史热榜",           //二级服务
            dataNumber: '0',                    //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                 //官方价
            discountAmount: "0",                //优惠价
            giftsAmount: "0",                   //抹零价
            realAmount: "0",                    //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api/v3/hot/search', 126)
            let sql1 = `select IFNULL(sum(times),0) as total from bill_hot where domain='search' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_hot where domain='search' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber = res[1][0][0].total
                list.officialPrice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.discountAmount = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.giftsAmount = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.realAmount = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor=factor.standardFactor
                list.realFactor=factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async trend(db, baseInfo){
        let list = {
            serviceName: "热榜",                //一级服务
            serviceType: "榜单趋势",           //二级服务
            dataNumber: '0',                    //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                 //官方价
            discountAmount: "0",                //优惠价
            giftsAmount: "0",                   //抹零价
            realAmount: "0",                    //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api/v3/hot/canvas/trend', 127)
            let sql1 = `select IFNULL(sum(times),0) as total from bill_hot where domain='trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_hot where domain='trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber = res[1][0][0].total
                list.officialPrice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.discountAmount = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.giftsAmount = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.realAmount = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor=factor.standardFactor
                list.realFactor=factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    }
}


async function overview(db, baseInfo) {
    try {
        // 查询当前子服务
        let apiFunctionName = await child(db, baseInfo)
        let list = []
        for (const item of apiFunctionName) {
            if (typeof fucntionClass[item] != 'function') {
                continue
            }
            let serviceInfo = await fucntionClass[item](db, baseInfo)
            list.push(serviceInfo)
        }
        await info(db, list, baseInfo)
        return list
    } catch (error) {
        return []
    }

}




module.exports = {
    overview
}  