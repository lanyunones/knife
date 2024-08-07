const mysql = require('mysql2');
const path = require('path')
const { get } = require('lodash');
const execArgs = require('parse-script-args')
const moment = require('moment');
const { Decimal } = require('decimal.js')
const { betweenDates } = require('../common/time.js')
const factorReal = require('./logic/factorReal.js')

/**
 * bill_xvs_search 迁移 bill_search
 */
let run = async function () {

    //初始化
    let args = (new execArgs())
        .addArg('-env', true, null, '运行环境')
        .parseArgs()
    let conf = require(path.join(__dirname, `../config/${args.env}`))

    // 实例化mysql道丁
    let db = mysql.createPool(conf.mysql.dowding)
    db = db.promise()

    let sdb = mysql.createPool(conf.mysql.sjpt)
    sdb = sdb.promise()

    try {
        let sql=`select * from bill_move`
        let userList=await db.query(sql)
        userList=userList[0]
       
        for(const item of userList){
           let aid= await db.query(`select account_id from account where login_entity='${item.phone}' and is_deleted=0 `)
                aid=aid[0]
            if(aid.length ==0){
                await db.query(`update bill_move set is_erreo=1,msg='道钉平台无账号' where id=${item.id}`)
            }else{
                await db.query(`update bill_move set aid=${aid[0].account_id} where id=${item.id}`)
            }    
            
            let sid= await sdb.query(`select id from sys_user where mobile='${item.phone}'`)
                sid=sid[0]
            if(sid.length ==0){
                await db.query(`update bill_move set is_erreo=2,msg='数据平台无账号' where id=${item.id}`)
            }else{
                await db.query(`update bill_move set sid=${sid[0].id} where id=${item.id}`)
            }   
        }


        let sql2=`select * from bill_move where sid is not null`
        let userList2=await db.query(sql2)
        userList2=userList2[0]
        for(const item of userList2){
            let token= await sdb.query(`select token from sys_user_info where user_id=${item.sid}`)
                token=token[0]
            if(token.length ==0){
                await db.query(`update bill_move set is_erreo=3,msg='数据平台无token' where id=${item.id}`)
            }else{
                await db.query(`update bill_move set token='${token[0].token}' where id=${item.id}`)
            }   
        }

    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);  //运行结束
    }

}


run();