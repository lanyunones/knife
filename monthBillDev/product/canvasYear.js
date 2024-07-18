const { map } = require('lodash')
const factorReal = require('../logic/factorReal.js')
const { Decimal } = require('decimal.js')
const { info } = require('../logic/insert.js')
// 查询子服务
async function child(db, baseInfo) {
    try {
        let sql = `select service_api from contract_detail where account_id=${baseInfo.aid} and order_detail_id='${baseInfo.order_detail_id}' and service_class->'$.value'=6`
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
            let sql = `select IFNULL(config->'$.standard_unit','0.01') as factor from contract_api where service='canvasYear' and level=2 and id=94`
            let standardFactor = await db.query(sql)
            standardFactor = new Decimal(standardFactor[0][0].factor).mul(new Decimal(10).pow(10)).toFixed()
            // 实际系数
            let realFactor = await factorReal.real(baseInfo.aid, baseInfo.contract_id, serviceUrl)
            return { standardFactor: standardFactor, realFactor: realFactor.realFactor }
        } catch (error) {
            return { standardFactor: '100000000', realFactor: '100000000' }
        }
    },
    async dataNumber(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "数据总量",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/data-number')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='data-number' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='data-number' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async spreadIndex(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "传播力指数",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/spread-index')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='spread-index' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='spread-index' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async sourceSpreadTrend(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "信源传播趋势图",      //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/source-spread-trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='source-spread-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='source-spread-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async videoSpreadTrend(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "短视频-信源传播趋势图",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/video-spread-trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='video-spread-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='video-spread-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async mediaRanking(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "媒体排行榜",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/media-ranking')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='media-ranking' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='media-ranking' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async tendentiousWordCloud(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "倾向性词云",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/tendentious-word-cloud')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='tendentious-word-cloud' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='tendentious-word-cloud' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async mediaSource(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "媒体来源",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/media-source')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='media-source' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='media-source' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async activeMediaTop(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "活跃媒体TOP10",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/active-media-top')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='active-media-top' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='active-media-top' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async tendentiousTrend(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "倾向性趋势",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/tendentious-trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='tendentious-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='tendentious-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async moodAnalyse(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "情绪分析",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/mood-analyse')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='mood-analyse' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='mood-analyse' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async interactGrowTrend(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "互动数增长趋势",      //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/interact-grow-trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='interact-grow-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='interact-grow-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async publishGrowTrend(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "发表类型增长趋势",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/publish-grow-trend')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='publish-grow-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='publish-grow-trend' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async startingMedia(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "首发媒体",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/starting-media')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='starting-media' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='starting-media' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async rankTypeRanking(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "分级分类-排行榜",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/rank-type-ranking')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='rank-type-ranking' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='rank-type-ranking' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async eventOverview(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "事件概述",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/sync/canvas/event-overview')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='event-overview' and type='sync' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='event-overview' and type='sync' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async videoEventOverview(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "短视频-事件概述",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/sync/canvas/video-event-overview')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='video-event-overview' and type='sync' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='video-event-overview' and type='sync' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async regionSpread(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "地域分布",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/region-spread')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='region-spread' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='region-spread' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async hotNews(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "热点资讯",                //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/hot-news')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='hot-news' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='hot-news' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
    async eventContext(db, baseInfo){
        let list = {
            serviceName: "看板分析（一年）",     //一级服务
            serviceType: "事件脉络",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                 // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/async/canvas/event-context')
            let sql1 = `select IFNULL(sum(times),0) as total from bill_canvas where name='event-context' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1`
            let sql2 = `select IFNULL(sum(times),0) as total from bill_canvas where name='event-context' and type='async' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2`
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
        await info(db,list,baseInfo)
        return list
    } catch (error) {
        return []
    }

}


module.exports = {
    overview
}  