const { map } = require('lodash')
const factorReal = require('../logic/factorReal.js')
const { Decimal } = require('decimal.js')
const { info } = require('../logic/insert.js')

// 查询子服务
async function child(db, baseInfo) {
    try {
        let sql = `select service_api from contract_detail where account_id=${baseInfo.aid} and order_detail_id='${baseInfo.order_detail_id}' and service_class->'$.value'=184`
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
    async factor(db, baseInfo, serviceUrl) {
        try {
            //标准系数
            let sql = `select IFNULL(config->'$.standard_unit','0.01') as factor from contract_api where service='yqmsAnalyse' and level=2 and id=185`
            let standardFactor = await db.query(sql)
            standardFactor = new Decimal(standardFactor[0][0].factor).mul(new Decimal(10).pow(10)).toFixed()
            // 实际系数
            let realFactor = await factorReal.real(baseInfo.aid, baseInfo.contract_id, serviceUrl)
            return { standardFactor: standardFactor, realFactor: realFactor.realFactor }
        } catch (error) {
            return { standardFactor: '100000000', realFactor: '100000000' }
        }
    },
    async subjectMedia(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息媒体分布",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/media')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/media' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/media' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectMediaTrend(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息媒体趋势",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/media/trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/media/trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/media/trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectAttitudeTrend(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息倾向性趋势",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/attitude/trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/attitude/trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/attitude/trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectHotWord(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息热点词云",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/hotWord')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/hotWord' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/hotWord' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectHotList(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息热点TOP10",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/hotList')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/hotList' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/hotList' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectSite(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息活跃媒体TOP10",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/site')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/site' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/site' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectTagIndustry(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息涉事分类",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/tag/industry')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/tag/industry' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/tag/industry' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectPublishRegion(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息地域统计-信息发布地域",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/publish/region')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/publish/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/publish/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectAuthor(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息活跃作者TOP10",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/author')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/author' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/author' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectAttitude(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "专题信息倾向性统计",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/attitude')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/attitude' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/attitude' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningTrend(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警走势",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/trend' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningPublishRegion(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警-信息发布地域",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/publish/region')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/publish/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/publish/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningMedia(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警-媒体分布",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/media')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/media' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/media' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningTagIndustry(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警-涉事分类",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/tag/industry')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/tag/industry' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/tag/industry' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningSiteActive(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警-活跃媒体",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/site/active')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/site/active' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/site/active' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningAuthorActive(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警-活跃作者",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/author/active')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/author/active' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/author/active' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async subjectContentRegion(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "地域统计-属地信息分布",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/subject/content/region')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/content/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/subject/content/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async warningContentRegion(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "预警-属地信息发布",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/warning/content/region')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/content/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/warning/content/region' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
    async searchTop(db, baseInfo) {
        let list = {
            serviceName: "舆情秘书统计分析API",    //一级服务
            serviceType: "全网搜榜单",      //二级服务
            dataNumber: '0',                       //数据量或者调用次数
            dataGiftNumber: '0',                   //抹零        
            officialPrice: "0",                    //官方价
            discountAmount: "0",                   //优惠价
            giftsAmount: "0",                      //抹零价
            realAmount: "0",                       //应付价
            standardFactor: '1',                   //标准系数 
            realFactor: '1',                       //实际系数   
        }
        try {
            let factor = await this.factor(db, baseInfo, '/yqms/v4/api/search/top')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/search/top' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_yqms where name='/yqms/v4/api/search/top' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
            })
            return list
        } catch (error) {
            return list
        }
    },
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