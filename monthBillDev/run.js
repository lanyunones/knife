const mysql = require('mysql2');
const path = require('path')
const execArgs = require('parse-script-args')
const user = require('./logic/user')
const product = require('./product')
const moment = require('moment');
const redis = require('../common/redis');
const { Decimal } = require('decimal.js')
const { bill } = require('./logic/insert.js')

//生成账单
let run = async function () {

    //初始化
    let args = (new execArgs())
        .addArg('-env', true, null, '运行环境')
        .parseArgs()
    let conf = require(path.join(__dirname, `../config/${args.env}`))

    // 实例化mysql道丁
    let mdb = mysql.createPool(conf.mysql.dowding)
    mdb = mdb.promise()

    //实例化redis
    const rds = redis.dowding(args.env)

    try {

        let users = await rds.get('dowding:billUser')

        if (users != null && users != '') {
            users = JSON.parse(users)
        } else {
            users = await user.users(mdb)
            await rds.set('dowding:billUser', JSON.stringify(users), 'EX', 86400)
        }

        // users = [

        // ]

        let totalSum=users.length
        let i=0
      
        // 按照用户生成账单
        for (const item of users) {
            if (item.sid == null || item.sid == '') {
                continue
            }

            // 时间
            let middle = moment().add(-1, 'months').startOf('months').add(14, 'd').format('YYYY-MM-DD')
            let start = moment().add(-1, 'months').startOf('months').format('x')
            let end = moment().add(-1, 'months').endOf('months').format('x')

            if (item.contract_start > start) {
                start = item.contract_start
            }

            if (item.contract_end < end) {
                end = item.contract_end
            }
            start = moment(Number(start)).format('YYYY-MM-DD')
            end = moment(Number(end)).format('YYYY-MM-DD')

            // 服务列表
            let serviceList = await user.serviceList(mdb, item.aid, item.order_detail_id)
           
            // 用户信息
            let baseInfo = {
                aid: item.aid,
                sid: item.sid,
                order_detail_id: item.order_detail_id,
                contract_id: item.contract_id,
                start: start,                   //实际统计时间段
                end: end,                       //实际统计时间段  
                year: start.substring(0, 4),
                month: start.substring(5, 7),
                middle: middle                   //月中旬统计时间
            }

            // 各个服务明细
            let productList = await product.allProduct(mdb, serviceList, baseInfo)

            // 用户总充值
            let money_refund = await user.moneyRefund(mdb, baseInfo)

            let billArr = {
                consume_sum: '0',
                money_cycle: '0',
                money_cycle_gift: '0',
                money_cycle_official: '0',
                money_debt: '0',
                money_refund: money_refund
            }

            for (const product of productList) {
                billArr.money_cycle_official = new Decimal(billArr.money_cycle_official).add(product.officialPrice).toFixed()
                billArr.money_cycle_gift = new Decimal(billArr.money_cycle_gift).add(product.giftsAmount).toFixed()
                billArr.money_cycle = new Decimal(billArr.money_cycle).add(product.realAmount).toFixed()
            }

            await bill(mdb, billArr, baseInfo)
            
            i++
            console.log(`进度：${i}/${totalSum}。用户ID:${item.aid},用户合同：${item.contract_id}`);
        }

    } catch (error) {
        console.log(error);
        throw new Error('运行异常' + error)
    } finally {
        process.exit(0);  //运行结束
    }

}


run();