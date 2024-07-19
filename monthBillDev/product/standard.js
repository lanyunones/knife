const { map } = require('lodash')
const factorReal = require('../logic/factorReal.js')
const { Decimal } = require('decimal.js')
const { infoStandard } = require('../logic/insert.js')
// 查询子服务
async function child(db, baseInfo) {
    try {
        let sql = `select service_api from contract_detail where account_id=${baseInfo.aid} and order_detail_id='${baseInfo.order_detail_id}' and service_class->'$.value'=1 and is_deleted=0`
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
            let sql = `select IFNULL(config->'$.standard_unit','0.01') as factor from contract_api where service='standard' and level=2 and id=8`
            let standardFactor = await db.query(sql)
            standardFactor = new Decimal(standardFactor[0][0].factor).mul(new Decimal(10).pow(10)).toFixed()
            // 实际系数
            let response = await factorReal.real(baseInfo.aid, baseInfo.contract_id, serviceUrl)
            return { standardFactor: standardFactor, realFactor: response.realFactor, more: response.more }
        } catch (error) {
            return { standardFactor: '100000000', realFactor: '100000000', more: "1" }
        }
    },

    // 全字段专题
    async allField(db, baseInfo) {
        let list = {
            serviceName: "数据服务",        //一级服务
            serviceType: "全字段订阅",     //二级服务 
            textNumber: "0",                //文本数据量
            videoNumber: "0",               //视频数据量
            textGiftNumber: "0",            //文本抹零数量
            videoGiftNumber: "0",           //视频抹零数量
            textOffice: "0",                //文本官方价
            videoOffice: "0",               //视频官方价
            textAll: "0",                   //文本优惠价
            videoAll: "0",                  //视频优惠价
            textGift: "0",                  //文本抹零价
            videoGift: "0",                 //视频抹零价
            textReal: "0",                  //文本实际价
            videoReal: "0",                 //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/allField')
            let sql1 = `
            SELECT
             (select IFNULL(sum(total),0) from back_bill_all_flag_2023 where sjpt_uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
             +
             (select IFNULL(sum(total),0) from bill_all_flag where sjpt_uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
            `
            let sql2 = `
            SELECT
             (select IFNULL(sum(total),0) from back_bill_all_flag_2023 where sjpt_uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
             +
             (select IFNULL(sum(total),0) from bill_all_flag where sjpt_uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
            `

            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.textNumber = total
                list.textGiftNumber = res[1][0][0].total
                list.textOffice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    // 资讯+v1/search
    async zxV1search(db, baseInfo) {
        let list = {
            serviceName: "数据服务",        //一级服务
            serviceType: "资讯订阅+v1search",         //二级服务 
            textNumber: "0",                //文本数据量
            videoNumber: "0",               //视频数据量
            textGiftNumber: "0",             //文本抹零数量
            videoGiftNumber: "0",            //视频抹零数量
            textOffice: "0",                //文本官方价
            videoOffice: "0",               //视频官方价
            textAll: "0",                   //文本优惠价
            videoAll: "0",                  //视频优惠价
            textGift: "0",                  //文本抹零价
            videoGift: "0",                 //视频抹零价
            textReal: "0",                  //文本实际价
            videoReal: "0",                 //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/v1/search')
            let sql1 = `
            SELECT
             (select IFNULL(sum(total),0) from bill_zx_flag where sjpt_uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) 
             +
             (select IFNULL(sum(total),0) from bill_xvs_search where name='/v1/search' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1) as total
            `
            let sql2 = `
            SELECT
             (select IFNULL(sum(total),0) from bill_zx_flag where sjpt_uid='${baseInfo.sid}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) 
             +
             (select IFNULL(sum(total),0) from bill_xvs_search where name='/v1/search' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2) as total
            `

            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.textNumber = total
                list.textGiftNumber = res[1][0][0].total
                list.textOffice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    async xsearch(db, baseInfo) {
        let list = {
            serviceName: "数据服务",        //一级服务
            serviceType: "xsearch",         //二级服务 
            textNumber: "0",   //文本数据量
            videoNumber: "0",  //视频数据量
            textGiftNumber: "0",             //文本抹零数量
            videoGiftNumber: "0",            //视频抹零数量
            textOffice: "0",  //文本官方价
            videoOffice: "0", //视频官方价
            textAll: "0",     //文本优惠价
            videoAll: "0",    //视频优惠价
            textGift: "0",    //文本抹零价
            videoGift: "0",   //视频抹零价
            textReal: "0",    //文本实际价
            videoReal: "0",   //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/xsearch')
            let sql1 = `
                SELECT 
                    IFNULL(sum(charge_deduct_size),0) as total
                from
                    bill_xvs_search
                where
                    name='/xsearch' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(charge_deduct_size),0) as total
                from
                    bill_xvs_search
                where
                    name='/xsearch' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `

            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.textNumber = total
                list.textGiftNumber = res[1][0][0].total
                list.textOffice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    async vsearch(db, baseInfo) {
        let list = {
            serviceName: "数据服务",        //一级服务
            serviceType: "vsearch",         //二级服务 
            textNumber: "0",   //文本数据量
            videoNumber: "0",  //视频数据量
            textGiftNumber: "0",             //文本抹零数量
            videoGiftNumber: "0",            //视频抹零数量
            textOffice: "0",  //文本官方价
            videoOffice: "0", //视频官方价
            textAll: "0",     //文本优惠价
            videoAll: "0",    //视频优惠价
            textGift: "0",    //文本抹零价
            videoGift: "0",   //视频抹零价
            textReal: "0",    //文本实际价
            videoReal: "0",   //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/vsearch')
            let sql1 = `
                SELECT 
                    IFNULL(sum(charge_deduct_size),0) as total
                from
                    bill_xvs_search
                where
                    name='/vsearch' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(charge_deduct_size),0) as total
                from
                    bill_xvs_search
                where
                    name='/vsearch' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `

            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.textNumber = total
                list.textGiftNumber = res[1][0][0].total
                list.textOffice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    async sliceSearch(db, baseInfo) {
        let list = {
            serviceName: "数据服务",        //一级服务
            serviceType: "sliceSearch",         //二级服务 
            textNumber: "0",   //文本数据量
            videoNumber: "0",  //视频数据量
            textGiftNumber: "0",             //文本抹零数量
            videoGiftNumber: "0",            //视频抹零数量
            textOffice: "0",  //文本官方价
            videoOffice: "0", //视频官方价
            textAll: "0",     //文本优惠价
            videoAll: "0",    //视频优惠价
            textGift: "0",    //文本抹零价
            videoGift: "0",   //视频抹零价
            textReal: "0",    //文本实际价
            videoReal: "0",   //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/sliceSearch')
            let sql1 = `
                SELECT 
                    IFNULL(sum(charge_deduct_size),0) as total
                from
                    bill_xvs_search
                where
                    name='/sliceSearch' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(charge_deduct_size),0) as total
                from
                    bill_xvs_search
                where
                    name='/sliceSearch' and uid=${baseInfo.sid} and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `

            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                let total = new Decimal(res[0][0][0].total).add(res[1][0][0].total).toFixed()
                list.textNumber = total
                list.textGiftNumber = res[1][0][0].total
                list.textOffice = new Decimal(total).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].total).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    // 标准搜索
    async search(db, baseInfo) {
        let list = {
            serviceName: "数据服务",        //一级服务
            serviceType: "标准search",     //二级服务 
            textNumber: "0",                //文本数据量
            videoNumber: "0",               //视频数据量
            textGiftNumber: "0",            //文本抹零数量
            videoGiftNumber: "0",           //视频抹零数量
            textOffice: "0",                //文本官方价
            videoOffice: "0",               //视频官方价
            textAll: "0",                   //文本优惠价
            videoAll: "0",                  //视频优惠价
            textGift: "0",                  //文本抹零价
            videoGift: "0",                 //视频抹零价
            textReal: "0",                  //文本实际价
            videoReal: "0",                 //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/consult/search')

            let sql1 = `
                SELECT 
                    IFNULL(sum(charge_deduct_video_number),0) as videoNumber, IFNULL(sum(charge_deduct_text_number),0) as textNumber,IFNULL(sum(text_size),0) as textSize,IFNULL(sum(video_size),0) as videoSize
                from
                    bill_search
                where
                    name='search' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(charge_deduct_video_number),0) as videoNumber, IFNULL(sum(charge_deduct_text_number),0) as textNumber,IFNULL(sum(text_size),0) as textSize,IFNULL(sum(video_size),0) as videoSize
                from
                    bill_search
                where
                    name='search' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                list.textNumber = new Decimal(res[0][0][0].textSize).add(res[1][0][0].textSize).toFixed()
                list.videoNumber = new Decimal(res[0][0][0].videoSize).add(res[1][0][0].videoSize).toFixed()
                list.textGiftNumber = res[1][0][0].textSize
                list.videoGiftNumber = res[1][0][0].videoSize
                list.textOffice = new Decimal(list.textNumber).mul(new Decimal(factor.standardFactor)).toFixed()
                list.videoOffice = new Decimal(list.videoNumber).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(list.textNumber).mul(new Decimal(factor.realFactor)).toFixed()
                list.videoAll = new Decimal(list.videoNumber).mul(factor.more).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.videoGift = new Decimal(res[1][0][0].videoSize).mul(factor.more).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.videoReal = new Decimal(res[0][0][0].videoSize).mul(factor.more).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    // 搜索总数
    async consultTotal(db, baseInfo) {
        let list = {
            serviceName: "数据服务",            //一级服务
            serviceType: "获取搜索总数",       //二级服务 
            textNumber: "0",                    //文本数据量
            videoNumber: "0",                   //视频数据量
            textGiftNumber: "0",                //文本抹零数量
            videoGiftNumber: "0",               //视频抹零数量
            textOffice: "0",                    //文本官方价
            videoOffice: "0",                   //视频官方价
            textAll: "0",                       //文本优惠价
            videoAll: "0",                      //视频优惠价
            textGift: "0",                      //文本抹零价
            videoGift: "0",                     //视频抹零价
            textReal: "0",                      //文本实际价
            videoReal: "0",                     //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/consult/total')

            let sql1 = `
                SELECT 
                    IFNULL(sum(times),0) as textSize, IFNULL(sum(charge_deduct_once_number),0) as textNumber
                from
                    bill_search
                where
                    name='total' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(times),0) as textSize, IFNULL(sum(charge_deduct_once_number),0) as textNumber
                from
                    bill_search
                where
                    name='total' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                list.textNumber = new Decimal(res[0][0][0].textSize).add(res[1][0][0].textSize).toFixed()
                list.textGiftNumber = res[1][0][0].textSize
                list.textOffice = new Decimal(list.textNumber).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(list.textNumber).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    // 回溯
    async kafkaTask(db, baseInfo) {
        let list = {
            serviceName: "数据服务",            //一级服务
            serviceType: "kafka推送",          //二级服务 
            textNumber: "0",                    //文本数据量
            videoNumber: "0",                   //视频数据量
            textGiftNumber: "0",                //文本抹零数量
            videoGiftNumber: "0",               //视频抹零数量
            textOffice: "0",                    //文本官方价
            videoOffice: "0",                   //视频官方价
            textAll: "0",                       //文本优惠价
            videoAll: "0",                      //视频优惠价
            textGift: "0",                      //文本抹零价
            videoGift: "0",                     //视频抹零价
            textReal: "0",                      //文本实际价
            videoReal: "0",                     //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'

        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/kafka/task')

            let sql1 = `
                SELECT 
                    IFNULL(sum(charge_deduct_video_number),0) as videoNumber, IFNULL(sum(charge_deduct_text_number),0) as textNumber,IFNULL(sum(text_size),0) as textSize,IFNULL(sum(video_size),0) as videoSize
                from
                    bill_search
                where
                    name='kafka' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(charge_deduct_video_number),0) as videoNumber, IFNULL(sum(charge_deduct_text_number),0) as textNumber,IFNULL(sum(text_size),0) as textSize,IFNULL(sum(video_size),0) as videoSize
                from
                    bill_search
                where
                    name='kafka' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                list.textNumber = new Decimal(res[0][0][0].textSize).add(res[1][0][0].textSize).toFixed()
                list.videoNumber = new Decimal(res[0][0][0].videoSize).add(res[1][0][0].videoSize).toFixed()
                list.textGiftNumber = res[1][0][0].textSize
                list.videoGiftNumber = res[1][0][0].videoSize
                list.textOffice = new Decimal(list.textNumber).mul(new Decimal(factor.standardFactor)).toFixed()
                list.videoOffice = new Decimal(list.videoNumber).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(list.textNumber).mul(new Decimal(factor.realFactor)).toFixed()
                list.videoAll = new Decimal(list.videoNumber).mul(factor.more).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.videoGift = new Decimal(res[1][0][0].videoSize).mul(factor.more).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.videoReal = new Decimal(res[0][0][0].videoSize).mul(factor.more).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    },

    // 道钉订阅
    async subscribe(db, baseInfo) {
        let list = {
            serviceName: "数据服务",    //一级服务
            serviceType: "订阅",       //二级服务 
            textNumber: "0",            //文本数据量
            videoNumber: "0",           //视频数据量
            textGiftNumber: "0",         //文本抹零数量
            videoGiftNumber: "0",        //视频抹零数量
            textOffice: "0",            //文本官方价
            videoOffice: "0",           //视频官方价
            textAll: "0",               //文本优惠价
            videoAll: "0",              //视频优惠价
            textGift: "0",              //文本抹零价
            videoGift: "0",             //视频抹零价
            textReal: "0",              //文本实际价
            videoReal: "0",             //视频实际价
            standardFactor: '1',
            realFactor: '1',
            more: '1'
        }
        try {
            let factor = await this.factor(db, baseInfo, '/api-dev/v3/subscribe/subject/create')
            let sql1 = `
                SELECT 
                    IFNULL(sum(total),0) as textSize              
                from
                    bill_subscribe
                where
                    name='search' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=1
            `
            let sql2 = `
                SELECT 
                    IFNULL(sum(total),0) as textSize              
                from
                    bill_subscribe
                where
                    name='search' and uid=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and stime between '${baseInfo.start}' and '${baseInfo.end}' and supplement=2
            `
            await Promise.all([
                db.query(sql1),
                db.query(sql2)
            ]).then(res => {
                list.textNumber = new Decimal(res[0][0][0].textSize).add(res[1][0][0].textSize).toFixed()
                list.textGiftNumber = res[1][0][0].textSize
                list.textOffice = new Decimal(list.textNumber).mul(new Decimal(factor.standardFactor)).toFixed()
                list.textAll = new Decimal(list.textNumber).mul(new Decimal(factor.realFactor)).toFixed()
                list.textGift = new Decimal(res[1][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.textReal = new Decimal(res[0][0][0].textSize).mul(new Decimal(factor.realFactor)).toFixed()
                list.standardFactor = factor.standardFactor
                list.realFactor = factor.realFactor
                list.more = factor.more
            })
            return list
        } catch (error) {
            return list
        }
    }
};


// 数据服务
async function overview(db, baseInfo) {
    try {
        // 查询当前子服务
        let apiFunctionName = await child(db, baseInfo)
        let list = {
            textNumber: "0",   //文本数据量
            videoNumber: "0",  //视频数据量
            textOffice: "0",   //文本官方价
            videoOffice: "0",  //视频官方价
            textAll: "0",      //文本优惠价
            videoAll: "0",     //视频优惠价
            textGift: "0",     //文本抹零价
            videoGift: "0",    //视频抹零价
            textReal: "0",     //文本实际价
            videoReal: "0",    //视频实际价
        }

        let infoList = []
        for (const item of apiFunctionName) {
            if (typeof fucntionClass[item] != 'function') {
                continue
            }
            let serviceInfo = await fucntionClass[item](db, baseInfo)
            infoList.push(serviceInfo)
            list.textNumber = new Decimal(list.textNumber).add(serviceInfo.textNumber).toFixed()
            list.videoNumber = new Decimal(list.videoNumber).add(serviceInfo.videoNumber).toFixed()
            list.textOffice = new Decimal(list.textOffice).add(serviceInfo.textOffice).toFixed()
            list.videoOffice = new Decimal(list.videoOffice).add(serviceInfo.videoOffice).toFixed()
            list.textAll = new Decimal(list.textAll).add(serviceInfo.textAll).toFixed()
            list.videoAll = new Decimal(list.videoAll).add(serviceInfo.videoAll).toFixed()
            list.textGift = new Decimal(list.textGift).add(serviceInfo.textGift).toFixed()
            list.videoGift = new Decimal(list.videoGift).add(serviceInfo.videoGift).toFixed()
            list.textReal = new Decimal(list.textReal).add(serviceInfo.textReal).toFixed()
            list.videoReal = new Decimal(list.videoReal).add(serviceInfo.videoReal).toFixed()
        }
        await infoStandard(db, infoList, baseInfo)

        return [
            {
                "serviceName": "数据服务",
                "serviceType": "文本类",
                "dataNumber": list.textNumber,
                "officialPrice": list.textOffice,
                "discountAmount": list.textAll,
                "giftsAmount": list.textGift,
                "realAmount": list.textReal
            },
            {
                "serviceName": "数据服务",
                "serviceType": "视频类",
                "dataNumber": list.videoNumber,
                "officialPrice": list.videoOffice,
                "discountAmount": list.videoAll,
                "giftsAmount": list.videoGift,
                "realAmount": list.videoReal
            }
        ]
    } catch (error) {
        return [
            {
                "serviceName": "数据服务",
                "serviceType": "文本类",
                "officialPrice": "0",
                "discountAmount": "0",
                "giftsAmount": "0",
                "realAmount": "0",
                "dataNumber": "0",
            },
            {
                "serviceName": "数据服务",
                "serviceType": "视频类",
                "officialPrice": "0",
                "discountAmount": "0",
                "giftsAmount": "0",
                "realAmount": "0",
                "dataNumber": "0",
            }
        ]
    }
}


module.exports = {
    overview
}  