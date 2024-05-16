const Redis = require("ioredis");
const _ = require("lodash")

/**
 * 获取指定Redis配置
 * @param {String} env 环境
 * @param {String} name 
 * @returns 
 */
function getConfig (env, name) {
    const configFile = require(`../config/${env}`)
    let conf = _.get(configFile.redis, name, null)
    if (_.isNull(conf)) {
        throw new Error(`未找到 ${name} 的Redis配置`)
    }

    return conf
}

module.exports = {
    errCode (env='dev') {
        const conf = getConfig(env, 'errCode') 
        return new Redis(conf);
    },
    dowding (env) {
        const conf = getConfig(env, 'dowding') 
        return new Redis(conf);
    }
}