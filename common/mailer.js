const nodemailer = require('nodemailer')



/**
 * 发送邮件 
 * @param {*} to  收件人邮箱，多个邮箱地址间用英文逗号隔开--XXX<XXX.XX@istarshine.com>
 * @param {*} subject  邮件主题
 * @param {*} msg  邮件正文（支持html格式）
 * @returns {Promise<void>}
 */
async function sendMailer(to, subject, msg) {
    //发件人邮箱及密码，setFrom--user：发件人邮箱，pass：发件人名称，name发件人名字
    const setFrom = {
        user: 'xiaoshuai.li@istarshine.com',
        pass: '3QB3FQWGy4gKHWai',
        name: ''
    }
    let transporter = nodemailer.createTransport({
        host: 'smtp.exmail.qq.com',
        secureConnection: true,  //use SSL
        port: 465,
        secure: true,  //secure: true for port 465, secure:false for port 587
        auth: {
            user: setFrom.user,
            pass: setFrom.pass,
        }
    });

    //设置邮件内容
    let mailOptions = {
        from: `${setFrom.name} <${setFrom.user}>`,  //发件人
        to: to,   //收件人
        subject: subject,  //主题
        // text: msg,  //文本内容
        html: msg,  //html body
        //发送附件
        // attachments: [
        //     {
        //         filename: 'test.txt',
        //         path: './test.txt',
        //     },
        //     {
        //         filename: 'content.xlsx',
        //         content: `<table border="1"><thead><tr ><th>客户名称</th></tr></thead><tbody></tbody></table>`
        //     }
        // ]
    };

    //使用先前创建的传输器的sendMail方法传递消息对象
    await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(`发送失败: ${error}`)
            } else {
                console.log('邮件发送成功');
                resolve()
            }
        });
    })
    // await transporter.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //         return `发送邮件失败：${error}`;
    //     }
    //     console.log(info);
    // });
    return true
}

module.exports = {
    sendMailer
}