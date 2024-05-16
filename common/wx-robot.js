const axios = require('axios').default
const _ = require('lodash')
const sendAtMsg = async (key, atUsers) => {
    let atMobileList = null
    if (atUsers === 'all') {
        atMobileList = ['@all']
    } else if (_.isArray(atUsers)) {
        atMobileList = atUsers
    }
    if (atMobileList === null) {
        return
    }
    try {

        await axios({
            method: 'POST',
            url: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`,
            data: {
                msgtype: 'text',
                text: {
                    content: '',
                    mentioned_mobile_list: atMobileList
                }
            },
            timeout: 5000
        })
    } catch (e) {
    }
}
module.exports = {
    userEnum: {
        WangHaotian: '18801232450',
        SongYanqiang: '18612016996',
        XingChen: '13439005722',
        HuangYuan: '13261682542',
        LiXiaoshuai: '15369038687',
        YuYong: '18810785879',
        ZhangBo: '18435119083',
        LanYun: '13214019936',
    },
    /**
     * 向微信机器人发送 markdown 内容
     * @param {String} content 发送内容
     * @param {String} key 机器人Key 
     */
    async sendMarkdown (content, key = null, atUsers = null) {
        // 向 企微群发警告
        let sendWx
        try {
            if (_.isEmpty(key)) {
                key = '5e324c02-a993-4527-907c-e3f034fb83b0'
            }
            sendWx = await axios({
                method: 'POST',
                url: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`,
                data: {
                    msgtype: 'markdown',
                    markdown: {
                        content: content,
                    }
                },
                timeout: 5000
            })
            console.log('企业微信发送完成', sendWx.status, sendWx.data);
            if (_.get(sendWx, 'data.errcode') !== 0) {
                if (_.isArray(sendWx.data) || _.isObject(sendWx.data)) {
                    sendWx.data = JSON.stringify(sendWx.data)
                }
                sendWx.data = String(sendWx.data)
                await axios({
                    method: 'POST',
                    url: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`,
                    data: {
                        msgtype: 'markdown',
                        markdown: {
                            content: `**<font color="red">企业微信推送失败: </font>**\n${sendWx.data}`,
                        }
                    },
                    timeout: 5000
                })
            }

            await sendAtMsg(key, atUsers)
            return true
        } catch (e) {
            console.log('企微发送警告失败', e);
            return false
        }
    },


    /**
     * 向微信机器人发送 text 内容
     * @param {*} content 
     * @param {*} url 
     * @returns 
     */
    async sendText (content, url = null) {
        // 向 企微群发警告
        let sendWx
        try {
            if (_.isEmpty(url)) {
                return
            }
            sendWx = await axios({
                method: 'POST',
                url: url,
                data: {
                    msgtype: 'text',
                    text: {
                        content: content,
                    }
                },
                timeout: 5000
            })
            console.log('企业微信发送完成', sendWx.status, sendWx.data);
            if (_.get(sendWx, 'data.errcode') !== 0) {
                if (_.isArray(sendWx.data) || _.isObject(sendWx.data)) {
                    sendWx.data = JSON.stringify(sendWx.data)
                }
                sendWx.data = String(sendWx.data)
                await axios({
                    method: 'POST',
                    url: url,
                    data: {
                        msgtype: 'markdown',
                        markdown: {
                            content: `**<font color="red">企业微信推送失败: </font>**\n${sendWx.data}`,
                        }
                    },
                    timeout: 5000
                })
            }
            return true
        } catch (e) {
            console.log('企微发送警告失败', e);
            return false
        }
    }
}