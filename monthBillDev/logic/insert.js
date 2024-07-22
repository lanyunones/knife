const { Decimal } = require('decimal.js')
const moment = require('moment');

// month_bill_info 
async function info(db, list, baseInfo) {
    try {
        for (const item of list) {
            let sql1 = `select id from month_bill_info where serviceName='${item.serviceName}' and serviceType='${item.serviceType}' and account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}' and year='${baseInfo.year}' and month='${baseInfo.month}' limit 1`
            let res = await db.query(sql1)
            res = res[0]
            let insertList = {
                bill_time: baseInfo.middle,
                year: baseInfo.year,
                month: baseInfo.month,
                account_id: baseInfo.aid,
                contract_id: baseInfo.contract_id,
                order_id: baseInfo.order_detail_id,
                serviceName: item.serviceName,
                serviceType: item.serviceType,
                officialPrice: item.officialPrice ?? 0,
                discountAmount: item.discountAmount ?? 0,
                giftsAmount: item.giftsAmount ?? 0,
                realAmount: item.realAmount ?? 0,
                dataNumber: item.dataNumber ?? 0,
                dataGiftNumber: item.dataGiftNumber ?? 0,
                standardFactor: item.standardFactor ?? 1,
                realFactor: item.realFactor ?? 1
            }

            if (res.length == 0) {
                let sql2 = `insert into month_bill_info 
            (bill_time,year,month,account_id,contract_id,order_id,serviceName,serviceType,officialPrice,discountAmount,giftsAmount,realAmount,dataNumber,dataGiftNumber,standardFactor,realFactor) 
          values
            ('${insertList.bill_time}','${insertList.year}','${insertList.month}',${insertList.account_id},'${insertList.contract_id}','${insertList.order_id}','${insertList.serviceName}','${insertList.serviceType}',${insertList.officialPrice},${insertList.discountAmount},${insertList.giftsAmount},${insertList.realAmount},${insertList.dataNumber},${insertList.dataGiftNumber},${insertList.standardFactor},${insertList.realFactor})     
          `
                await db.query(sql2)
            } else {
                let sql3 = `update month_bill_info set 
                officialPrice=${insertList.officialPrice},discountAmount=${insertList.discountAmount},giftsAmount=${insertList.giftsAmount},realAmount=${insertList.realAmount},dataNumber=${insertList.dataNumber},dataGiftNumber=${insertList.dataGiftNumber},standardFactor=${insertList.standardFactor},realFactor=${insertList.realFactor}
                where id=${res[0].id}    
                `
                //await db.query(sql3)
            }

        }
    } catch (error) {
        console.log(`写入month_bill_info失败`)
    }
}

// 标准数据服务 month_bill_info
async function infoStandard(db, list, baseInfo) {
    try {
        for (const item of list) {
            let sql1 = `select id from month_bill_info where serviceName='${item.serviceName}' and serviceType='${item.serviceType}' and account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}' and year='${baseInfo.year}' and month='${baseInfo.month}' limit 1`
            let res = await db.query(sql1)
            res = res[0]
            let insertList = {
                bill_time: baseInfo.middle,
                year: baseInfo.year,
                month: baseInfo.month,
                account_id: baseInfo.aid,
                contract_id: baseInfo.contract_id,
                order_id: baseInfo.order_detail_id,
                serviceName: item.serviceName,
                serviceType: item.serviceType,
                officialPrice: new Decimal(item.textOffice).add(item.videoOffice).toFixed(),
                discountAmount: new Decimal(item.textAll).add(item.videoAll).toFixed(),
                giftsAmount: new Decimal(item.textGift).add(item.videoGift).toFixed(),
                realAmount: new Decimal(item.textReal).add(item.videoReal).toFixed(),
                dataNumber: new Decimal(item.textNumber).add(item.videoNumber).toFixed(),
                dataGiftNumber: new Decimal(item.textGiftNumber).add(item.videoGiftNumber).toFixed(),
                standardFactor: item.standardFactor ?? '1',
                realFactor: item.realFactor ?? '1',
                more: item.more ?? '1',
                textNumber: item.textNumber ?? '0',
                videoNumber: item.videoNumber ?? '0',
                textGiftNumber: item.textGiftNumber ?? '0',
                videoGiftNumber: item.videoGiftNumber ?? '0',
                textOffice: item.textOffice ?? '0',
                videoOffice: item.videoOffice ?? '0',
                textAll: item.textAll ?? '0',
                videoAll: item.videoAll ?? '0',
                textGift: item.textGift ?? '0',
                videoGift: item.videoGift ?? '0',
                textReal: item.textReal ?? '0',
                videoReal: item.videoReal ?? '0'
            }

            if (res.length == 0) {
                let sql2 = `insert into month_bill_info 
            (bill_time,year,month,account_id,contract_id,order_id,serviceName,serviceType,officialPrice,discountAmount,giftsAmount,realAmount,dataNumber,dataGiftNumber,standardFactor,realFactor,more,textNumber,videoNumber,textGiftNumber,videoGiftNumber,textOffice,videoOffice,textAll,videoAll,textGift,videoGift,textReal,videoReal) 
            values
            ('${insertList.bill_time}','${insertList.year}','${insertList.month}',${insertList.account_id},'${insertList.contract_id}','${insertList.order_id}','${insertList.serviceName}','${insertList.serviceType}',${insertList.officialPrice},${insertList.discountAmount},${insertList.giftsAmount},${insertList.realAmount},${insertList.dataNumber},${insertList.dataGiftNumber},${insertList.standardFactor},${insertList.realFactor},${insertList.more},${insertList.textNumber},${insertList.videoNumber},${insertList.textGiftNumber},${insertList.videoGiftNumber},${insertList.textOffice},${insertList.videoOffice},${insertList.textAll},${insertList.videoAll},${insertList.textGift},${insertList.videoGift},${insertList.textReal},${insertList.videoReal})        
            `
                await db.query(sql2)
            } else {
                let sql3 = `update month_bill_info set 
                officialPrice=${insertList.officialPrice},discountAmount=${insertList.discountAmount},giftsAmount=${insertList.giftsAmount},realAmount=${insertList.realAmount},dataNumber=${insertList.dataNumber},dataGiftNumber=${insertList.dataGiftNumber},standardFactor=${insertList.standardFactor},realFactor=${insertList.realFactor},more=${insertList.more},textNumber=${insertList.textNumber},videoNumber=${insertList.videoNumber},textGiftNumber=${insertList.textGiftNumber},videoGiftNumber=${insertList.videoGiftNumber},textOffice=${insertList.textOffice},videoOffice=${insertList.videoOffice},textAll=${insertList.textAll},videoAll=${insertList.videoAll},textGift=${insertList.textGift},videoGift=${insertList.videoGift},textReal=${insertList.textReal},videoReal=${insertList.videoReal}
                where id=${res[0].id}    
                `
                //await db.query(sql3)
            }
        }
    } catch (error) {
        console.log(`标准数据服务写入month_bill_info失败`)
    }
}

// 写入month_bill_child
async function child(db, list, baseInfo) {
    try {
        for (const item of list) {
            let sql1 = `select id from month_bill_child where account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}' and year='${baseInfo.year}' and month='${baseInfo.month}' and serviceName='${item.serviceName}' and serviceType='${item.serviceType}' `
            let res = await db.query(sql1)
            res = res[0]
            let insertList = {
                bill_time: baseInfo.middle,
                year: baseInfo.year,
                month: baseInfo.month,
                account_id: baseInfo.aid,
                contract_id: baseInfo.contract_id,
                order_id: baseInfo.order_detail_id,
                serviceName: item.serviceName,
                serviceType: item.serviceType,
                officialPrice: item.officialPrice,
                discountAmount: item.discountAmount,
                giftsAmount: item.giftsAmount,
                realAmount: item.realAmount
            }
            if (res.length == 0) {
                let sql2 = `insert into month_bill_child (bill_time,year,month,account_id,contract_id,order_id,serviceName,serviceType,officialPrice,discountAmount,giftsAmount,realAmount) 
                values
                ('${insertList.bill_time}','${insertList.year}','${insertList.month}',${insertList.account_id},'${insertList.contract_id}','${insertList.order_id}','${insertList.serviceName}','${insertList.serviceType}',${insertList.officialPrice},${insertList.discountAmount},${insertList.giftsAmount},${insertList.realAmount})
                `
                await db.query(sql2)
            } else {
                let sql3 = `update month_bill_child set officialPrice=${insertList.officialPrice},discountAmount=${insertList.discountAmount},giftsAmount=${insertList.giftsAmount},realAmount=${insertList.realAmount} where id=${res[0].id}`
                //await db.query(sql3)
            }
        }
    } catch (error) {
        console.log(`写入month_bill_child失败`)
    }
}


// 写入month_bill
async function bill(db, list, baseInfo) {
    try {
        let sql1 = `select id from month_bill where account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}' and year='${baseInfo.year}' and month='${baseInfo.month}' `
        let res = await db.query(sql1)
        res = res[0]

        // 异常账单标识
        let inform_type = 0
        let inform_msg=[]

        // 判断1 月度数据量超过50万且环比浮动超过300%
        let sqlp1=`select IFNULL((sum(dataNumber)-sum(dataGiftNumber)),0) as dataNumber from month_bill_info where account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}' and year='${baseInfo.year}' and month='${baseInfo.month}'`
        let pd1 = await db.query(sqlp1)

        pd1=Number(pd1[0][0]["dataNumber"])    
        if(pd1 > 500000){
            let lastTime = moment().subtract(2,'month').format('YYYY-MM')
            //判断环比
            let sqllast=`select IFNULL((sum(dataNumber)-sum(dataGiftNumber)),0) as dataNumber from month_bill_info where account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}' and year='${lastTime.substring(0,4)}' and month='${lastTime.substring(5,7)}'`
            let lastNumber = await db.query(sqllast)
            lastNumber=Number(lastNumber[0][0]["dataNumber"])   
            if(lastNumber > 0){
                let aim=(pd1-lastNumber)/lastNumber * 100
                if(aim  > 300 ){
                    inform_type=1
                    inform_msg.push('1.月度数据量超过50万且环比浮动超过300%')
                }
            }
        }
        
        // 判断2 当月消耗量超过年度消耗量的20%
        let sqlp2=`select IFNULL(sum(quantity),0) as quantity from contract_detail where account_id=${baseInfo.aid} and order_detail_id='${baseInfo.order_detail_id}'`
        let pd2 = await db.query(sqlp2)
        pd2=Number(pd2[0][0]["quantity"])   
        if(pd1 > pd2*0.2){
            inform_type=1
            inform_msg.push('2.月度数据量超过年度消耗量的20%')
        }

        if (res.length == 0) {
            // 计算总消耗
            let sql2 = `select IFNULL(sum(money_cycle),0) as totalMoney from month_bill where account_id=${baseInfo.aid} and contract_id='${baseInfo.contract_id}' and order_id='${baseInfo.order_detail_id}'`
            let totalMoney = await db.query(sql2)
            totalMoney = totalMoney[0][0].totalMoney
            list.consume_sum = new Decimal(totalMoney).add(list.money_cycle).toFixed()
            list.money_debt = new Decimal(list.consume_sum).sub(list.money_refund).toFixed()
            let sql3 = `insert into month_bill (year,month,bill_time,create_at,true_start,true_end,contract_id,order_id,account_id,consume_sum,money_cycle,money_cycle_gift,money_cycle_official,money_refund,money_debt,ack_type,inform_type,inform_msg)
            values
            ('${baseInfo.year}','${baseInfo.month}','${baseInfo.middle}','${moment().format('YYYY-MM-DD HH:mm:ss')}','${baseInfo.start}','${baseInfo.end}','${baseInfo.contract_id}','${baseInfo.order_detail_id}',${baseInfo.aid},${list.consume_sum},${list.money_cycle},${list.money_cycle_gift},${list.money_cycle_official},${list.money_refund},${list.money_debt},'出账中',${inform_type},'${inform_msg.join(',')}')
            `
            await db.query(sql3)
        }

    } catch (error) {
        console.log(`写入month_bill失败`)
    }
}


module.exports = {
    info,
    infoStandard,
    child,
    bill
}  