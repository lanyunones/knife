const account = require('./product/account')
const canvas = require('./product/canvas')
const canvasYear = require('./product/canvasYear')
const comment = require('./product/comment')
const del = require('./product/del')
const hot = require('./product/hot')
const index = require('./product/index')
const interact = require('./product/interact')
const standard = require('./product/standard')
const video = require('./product/video')
const yqmsAnalyse = require('./product/yqmsAnalyse')
const yqmsStandard = require('./product/yqmsStandard')
const { child } = require('./logic/insert.js')

async function allProduct(db, serviceList, baseInfo) {

    let box = []
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
}





module.exports = {
    allProduct
}  