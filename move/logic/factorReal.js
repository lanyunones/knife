const axios = require('axios')


//生成
async function real(account_id, contract_id, url, source = '') {
    try {
        let path = "http://admin-dowding.istarshine.com/node-api/api/getFactor"
        let body = {
            "account_id": account_id,
            "contract_id": contract_id,
            "url": url,
            "source": source
        }
        let res = await axios.post(path, body)
        let factor = res?.data?.data?.data?.factor ?? '0.01'
        let more = res?.data?.data?.data?.more_charge ?? '1'
        return { realFactor: factor, more: String(more) }
    } catch (error) {
        return { realFactor: '0.01', more: '1' }

    }

}


module.exports = {
    real
} 