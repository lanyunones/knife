const db = require('mysql2')
const _ = require("lodash")
// const { default: PromisePool } = require('async-promise-pool')

/**
 * 获取指定 Mysql 配置
 * @param {String} env 环境
 * @param {String} name 
 * @returns 
 */
function getConfig (env, name) {
    const configFile = require(`../config/${env}`)
    let conf = _.get(configFile.mysql, name, null)
    if (_.isNull(conf)) {
        throw new Error(`未找到 ${name} 的 Mysql 配置`)
    }

    return conf
}

module.exports = {

    /**
     * 获取道丁库实例
     * @param {String} env 
     */
    dowding (env) {
        const conf = getConfig(env, 'dowding')
        const dbPool = db.createPool(conf)
        return dbPool.promise()
    }
}