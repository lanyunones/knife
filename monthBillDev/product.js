const account = require('./product/account.js')
const canvas = require('./product/canvas.js')
const canvasYear = require('./product/canvasYear.js')
const comment = require('./product/comment.js')
const del = require('./product/del.js')
const hot = require('./product/hot.js')
const index = require('./product/index')
const interact = require('./product/interact.js')
const standard = require('./product/standard.js')
const video = require('./product/video.js')
const yqmsAnalyse = require('./product/yqmsAnalyse.js')
const yqmsStandard = require('./product/yqmsStandard.js')
const { child } = require('./logic/insert.js')

async function allProduct(db, serviceList, baseInfo) {

    let box = []
    try {
        for (const item of serviceList) {
            let list
            switch (item["functionName"]) {
                case 'account':
                    list = await account.overview(db, baseInfo)
                    break;
                case 'canvas':
                    list = await canvas.overview(db, baseInfo)
                    break;
                case 'canvasYear':
                    list = await canvasYear.overview(db, baseInfo)
                    break;
                case 'comment':
                    list = await comment.overview(db, baseInfo)
                    break;
                case 'del':
                    list = await del.overview(db, baseInfo)
                    break;
                case 'hot':
                    list = await hot.overview(db, baseInfo)
                    break;
                case 'index':
                    list = await index.overview(db, baseInfo)
                    break;
                case 'interact':
                    list = await interact.overview(db, baseInfo)
                    break;
                case 'standard':
                    list = await standard.overview(db, baseInfo)
                    break;
                case 'video':
                    list = await video.overview(db, baseInfo)
                    break;
                case 'yqmsAnalyse':
                    list = await yqmsAnalyse.overview(db, baseInfo)
                    break;
                case 'yqmsStandard':
                    list = await yqmsStandard.overview(db, baseInfo)
                    break;
            }
            for (const item of list) {
                box.push(item)
            }
        }
        await child(db, box, baseInfo)
        return box
    } catch (error) {
        return box
    }


}





module.exports = {
    allProduct
}  