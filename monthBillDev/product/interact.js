const { map } = require('lodash')
const factorReal = require('../logic/factorReal.js')
const { Decimal } = require('decimal.js')
const { info } = require('../logic/insert.js')
// 查询子服务
async function child(db, baseInfo) {
    try {
        let sql = `select service_api from contract_detail where account_id=${baseInfo.aid} and order_detail_id='${baseInfo.order_detail_id}' and service_class->'$.value'=2 and is_deleted=0`
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
    async factor(db, baseInfo, serviceUrl, fid, source) {
        try {
            //标准系数
            let sql = `select IFNULL(config->'$.standard_unit','0.01') as factor from contract_api where service='interact' and level=2 and id=${fid}`
            let standardFactor = await db.query(sql)
            standardFactor = new Decimal(standardFactor[0][0].factor).mul(new Decimal(10).pow(10)).toFixed()
            // 实际系数
            let realFactor = await factorReal.real(baseInfo.aid, baseInfo.contract_id, serviceUrl, source)
            return { standardFactor: standardFactor, realFactor: realFactor.realFactor }
        } catch (error) {
            return { standardFactor: '100000000', realFactor: '100000000' }
        }
    },
    async weibo(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "新浪微博",            //二级服务
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 16, 'weibo')
            let sql1 = `
             SELECT
             (select IFNULL(sum(times),0) from bill_interact where domain='weibo' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
             +
             (select IFNULL(sum(times),0) from bill_interact_sjpt where domain='weibo' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
            `
            let sql2 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='weibo' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain='weibo' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
           `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
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
    async weixin(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "微信",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 17, 'weixin')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='weixin' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain='weixin' and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='weixin' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain='weixin' and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `

            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async douyin(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "抖音",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 18, 'douyin')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='douyin' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('iesdouyin.com','douyin.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='douyin' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('iesdouyin.com','douyin.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async kuaishou(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "快手",               //二级服务 
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
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 114, 'kuaishou')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='kuaishou' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('iesdouyin.com','douyin.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='kuaishou' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('kuaishou.com','live.kuaishou.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async xiaohongshu(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "小红书",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零       
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 115, 'xiaohongshu')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='xiaohongshu' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('xiaohongshu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='xiaohongshu' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('xiaohongshu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async bilibili(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "B站",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 116, 'bilibili')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='bilibili' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('bilibili.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='bilibili' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('bilibili.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async toutiao(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "今日头条",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 117, 'toutiao')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='toutiao' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('toutiao.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='toutiao' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('toutiao.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async sina(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "新浪新闻",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 118, 'sina')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='sina' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('sina.cn','sina.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='sina' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('sina.cn','sina.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async baijiahao(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "百度百家号",           //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 119, 'baijiahao')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='baijiahao' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('baijiahao.baidu.com','mbd.baidu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='baijiahao' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('baijiahao.baidu.com','mbd.baidu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async zhihu(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "知乎",           //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 120, 'zhihu')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='zhihu' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('zhihu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='zhihu' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('zhihu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async chejiahao(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "车家号",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 121, 'chejiahao')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='chejiahao' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('chejiahao.autohome.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='chejiahao' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('chejiahao.autohome.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async club(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "汽车之家",               //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 144, 'club')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='club' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('club.autohome.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='club' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('club.autohome.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async netease(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "网易新闻",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 175, 'netease')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='netease' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('163.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='netease' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('163.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async sohu(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "搜狐新闻",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 177, 'sohu')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='sohu' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('sohu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='sohu' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('sohu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async txnews(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "腾讯新闻",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 211, 'txnews')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='txnews' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('qq.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='txnews' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('qq.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async ucnews(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "UC新闻",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 212, 'ucnews')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='ucnews' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('uc.cn','uczzd.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='ucnews' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('uc.cn','uczzd.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async blackcat(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "黑猫投诉",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 213, 'blackcat')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='blackcat' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('tousu.sina.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='blackcat' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('tousu.sina.com.cn') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async xigua(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "西瓜视频",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 214, 'xigua')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='xigua' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('ixigua.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='xigua' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('ixigua.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async dcdapp(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "懂车帝",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 215, 'dcdapp')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='dcdapp' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('dcdapp.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='dcdapp' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('dcdapp.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async yidianzixun(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "一点资讯",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 216, 'yidianzixun')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='yidianzixun' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('yidianzixun.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='yidianzixun' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('yidianzixun.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async haokan(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "好看视频",             //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 217, 'haokan')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='haokan' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('haokan.baidu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='haokan' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('haokan.baidu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async iqiyi(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "爱奇艺",              //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 218, 'iqiyi')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='iqiyi' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('iqiyi.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='iqiyi' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('iqiyi.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async quanmin(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "度小视",              //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                     //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 219, 'quanmin')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='quanmin' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('quanmin.baidu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='quanmin' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('quanmin.baidu.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async txvideo(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "腾讯视频",              //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 229, 'txvideo')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='txvideo' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('v.qq.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='txvideo' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('v.qq.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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
    async xiaohongshuPrecise(db, baseInfo) {
        let list = {
            serviceName: "互动数刷新",            //一级服务
            serviceType: "小红书(精准)",         //二级服务 
            dataNumber: '0',                     //数据量或者调用次数
            dataGiftNumber: '0',                // 抹零        
            officialPrice: "0",                  //官方价
            discountAmount: "0",                 //优惠价
            giftsAmount: "0",                    //抹零价
            realAmount: "0",                      //应付价
            standardFactor: '1',
            realFactor: '1',
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/spread/sync/interact', 231, 'xiaohongshuPrecise')
            let sql1 = `
            SELECT
            (select IFNULL(sum(times),0) from bill_interact where domain='xiaohongshu-precise' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
            +
            (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('xiaohongshuPrecise.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
           `
            let sql2 = `
           SELECT
           (select IFNULL(sum(times),0) from bill_interact where domain='xiaohongshu-precise' and uid='${baseInfo.aid}' and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
           +
           (select IFNULL(sum(times),0) from bill_interact_sjpt where domain in ('xiaohongshuPrecise.com') and uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
          `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.dataNumber = total
                list.dataGiftNumber=res[1][0][0].total
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