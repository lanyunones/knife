const { Decimal } = require('decimal.js')


async function xsearch(db, sdb, userInfo) {

    let sql = `SELECT sum(total_amount) as total,info_flag FROM sys_interface_status_es where interface_name='/xsearch' and token='${userInfo.token}' and ct ='${userInfo.time}' and info_flag in ('0101','0105','0109','02','03','04','0411','06','07','11','17','21','1201','1202','1301','1302') GROUP BY info_flag`
    let res = await sdb.query(sql)
    let list = res[0]
    if (list.length == 0) {
        return
    }
    let sql2 = `SELECT sum(total_amount) as total,info_flag FROM sys_interface_status_es where interface_name='/xsearch' and token='${userInfo.token}' and ct ='${userInfo.time}' and info_flag in ('0101','0105','0109','02','03','04','0411','06','07','11','17','21','1201','1202','1301','1302')`
    let res2 = await sdb.query(sql2)
    let total = res2[0][0].total

    for (const item of list) {
        let number = new Decimal(item.total).mul(userInfo.factor).toFixed()
        let sqls = `select id from info_flag_bill where uid=${userInfo.uid} and contract_id='${userInfo.contract_id}' and domain='xsearch' and stime='${userInfo.timestr}' and flag='${item.info_flag}'`
        let count = await db.query(sqls)
        count = count[0]

        let sqlinsert
        if (count.length== 0) {
           sqlinsert = `insert into info_flag_bill 
            (stime,uid,contract_id,domain,flag,size,number)
            values
            ('${userInfo.timestr}','${userInfo.uid}','${userInfo.contract_id}','xsearch','${item.info_flag}',${item.total},'${number}')
            `
        }else{
           sqlinsert = `update info_flag_bill set size=${item.total},number=${number} where id=${count[0].id}`
          
        }
         await db.query(sqlinsert)
    }

    let cnumber = new Decimal(total).mul(userInfo.factor).toFixed()

    let sql3=`select id from bill_search where uid=${userInfo.uid} and contract_id='${userInfo.contract_id}' and stime='${userInfo.timestr}' and name='xsearch'`
    let res3 = await db.query(sql3)
    res3=res3[0]

    let sqlS
    if(res3.length==0){
        sqlS = `insert into bill_search 
            (stime,uid,charge_deduct_number,charge_deduct_size,times,name,contract_id,text_size,charge_deduct_text_number)
            values
            ('${userInfo.timestr}',${userInfo.uid},${cnumber},${total},1,'xsearch','${userInfo.contract_id}',${total},${cnumber})
            `
    }else{
        sqlS =`update bill_search set charge_deduct_number=${cnumber},charge_deduct_size=${total},charge_deduct_text_number=${cnumber},text_size=${total} where id=${res3[0].id}`
    }
    await db.query(sqlS)
}

module.exports = {
    xsearch
} 