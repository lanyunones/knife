const redis = require('./redis')
const _ = require('lodash')

module.exports = {
    ErrorCodeException: class ErrorCodeException extends Error {
        /**
         * 错误码异常类
         * @param {String} message 错误码
         * @param {Object} variable 关联错误码的变量映射
         */
        constructor(code, variable = {}) {
            super(code)
            this.name = 'ErrorCodeException'
            this.variable = variable
        }
    },

    /**
     * 根据错误码获取错误信息
     * @param {String} code 
     */
    async getMessageByCode (code) {
        let rds = redis.errCode()
        let codeInfo = await rds.hget('dowding:ks:MsgDict', code)
        if (_.isEmpty(codeInfo)) {
            return `异常码未定义 [${code}]`
        }
        codeInfo = JSON.parse(codeInfo)
        const sentry = require('./sentry')
        sentry.setTag('author', codeInfo.maintainer)
        return `${codeInfo.user_msg} [${code}]`
    }
}