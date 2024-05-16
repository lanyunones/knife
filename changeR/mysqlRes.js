const _ = require('lodash');
const { Decimal } = require('decimal.js')

/**
 * 
 * @param {*} db    数据库实例
 */
async function mysqlBill(db, userInfo) {
    //console.log(userInfo);
    for (const item of userInfo.contract) {
        //账号刷新
        let accountSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_account where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //看板
        let canvasSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_canvas where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //评论
        let commentSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_comment where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //删除
        let delSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_delete where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //热榜
        let hotSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_hot where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //指数
        let indexSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_index where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //互动数
        let interactSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_interact where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //搜索
        let searchSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_search where uid=${userInfo.uid} and contract_id='${item.contract_id}'`
        //舆情秘书
        let yqmsSql = `select SUM(IFNULL(charge_deduct_number, 0)+IFNULL(charge_deduct_once_number, 0)) as total from bill_yqms where uid=${userInfo.uid} and contract_id='${item.contract_id}'`

        let total = '0'

        //执行查询(专题单独计算)
        await Promise.all([
            db.query(accountSql),
            db.query(canvasSql),
            db.query(commentSql),
            db.query(delSql),
            db.query(hotSql),
            db.query(indexSql),
            db.query(interactSql),
            db.query(searchSql),
            db.query(yqmsSql),
        ]).then(async (res) => {
            for (const i of res) {
                let child = _.get(i, `[0]`, null)
                if (child === null) { continue }
                for (const ite of child) {
                    if (ite.total != null) {
                        total = new Decimal(total).add(ite.total).toFixed()
                    }
                }
            }
        })
       

        //专题数据处理
        let subject = await db.query(`select factor,SUM(total) as total from bill_subscribe where uid=${userInfo.uid} and contract_id='${item.contract_id}'`)
        subject = subject[0]
       

        let subTotal='0'
        _.forEach(subject,item => {
            if(item.total!=null && item.factor!=null){
                subTotal = new Decimal(item.total).mul(item.factor).toFixed()
            }
        });

        item.mysqlCost=new Decimal(total).add(subTotal).toFixed()

        
    }
    
    return userInfo
}


/**
 * 获取用户全部ID
 * @param {*} db 
 * @returns 
 */
async function allUserIds(db) {
    //账号刷新
    let accountSql = `select uid from bill_account group by uid`
    //看板
    let canvasSql = `select uid from bill_canvas group by uid`
    //评论
    let commentSql = `select uid from bill_comment group by uid`
    //删除
    let delSql = `select uid from bill_delete group by uid`
    //热榜
    let hotSql = `select uid from bill_hot group by uid`
    //指数
    let indexSql = `select uid from bill_index group by uid`
    //互动数
    let interactSql = `select uid from bill_interact group by uid`
    //搜索
    let searchSql = `select uid from bill_search group by uid`
    //舆情秘书
    let yqmsSql = `select uid from bill_yqms group by uid`

    let userBox = []
    //执行查询(专题单独计算)
    await Promise.all([
        db.query(accountSql),
        db.query(canvasSql),
        db.query(commentSql),
        db.query(delSql),
        db.query(hotSql),
        db.query(indexSql),
        db.query(interactSql),
        db.query(searchSql),
        db.query(yqmsSql),
    ]).then(async (res) => {
        for (const i of res) {
            let item = _.get(i, `[0]`, null)
            if (item === null) { continue }
            for (const ite of item) {
                if (typeof (ite) !== "undefined") {
                    userBox.push(ite)
                }
            }
        }
    })

    //用户ID集合
    let uids = _.map(userBox, 'uid')
    return _.uniq(uids)
}


/**
 * 用户合同
 * @param {*} uid 
 */
async function userContract(db, uid) {
    let sql = `
            select
                contract_id,hashkey
            from
                contract
            where
                account_id=${uid}
        `
    let list = await db.query(sql)
    list = list[0]

    //将合同充值金额写入合同信息
    for (const item of list) {
        let sql = `select sum(IFNULL(amount, 0)) as total from api_recharged where contract_id='${item.contract_id}' and account_id = ${uid} and is_deleted=0`
        let amount = await db.query(sql)
        amount = amount[0]
        item.amount =String(_.get(amount, "[0].total", 0)) 
    }

    return list
}


module.exports = {
    mysqlBill,
    userContract,
    allUserIds
}