module.exports = {
    mysql: {
        dowding: {
            host: "xgks-mysql.istarshine.net.cn",
            user: "dowdingadmin",
            port: '3306',
            password: "dowding2099!",
            database: "dowding_dev",
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            //timezone: '08:00'
        },
        sjpt: {
            host: 'mysql-xgsj-node1.istarshine.net.cn', //192.168.185.61
            port: '3306',
            user: 'root', //puser
            password: 'dc89u72ptkjy', //1y7b57
            database: 'gaea',
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0
        },
        bill: {
            host: "xgks-mysql.istarshine.net.cn",
            user: "dowdingadmin",
            port: '3306',
            password: "dowding2099!",
            database: "dowding_dev",
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            supportBigNumbers: true,
            bigNumberStrings: true

        },
    },
    es: {
        elk: {
            host: 'http://192.168.141.34:9200/'
        },
        url: 'http://test_dowding_kuaisearch:4EF43BDC7A9EFDAA637FF46360AAC1B1@192.168.223.100:8000'
    },
    webdav: {
        // url: 'https://dowding-gwa.istarshine.com/timing/dev/files/'
        url: '/ql/webdav/timing-report/dev/'
    },
    redis: {
        dowding: {
            host: "dowding-redis-1.istarshine.net.cn",
            port: 6379,
            db: 5,
        },
        errCode: {
            host: "dowding-redis-1.istarshine.net.cn",
            port: 6379,
            db: 5,
        }
    },
    // 专题相关接口
    subject: {
        // 专题创建接口
        create: 'http://192.168.223.81:32260/subject/add?token=b0437786-8708-4b65-ae1f-31270178900f',
        // 更新专题接口
        update: 'http://192.168.223.81:32260/subject/update?token=b0437786-8708-4b65-ae1f-31270178900f',
        // 删除专题接口
        delete: 'http://192.168.223.81:32260/subject/del?token=b0437786-8708-4b65-ae1f-31270178900f',
        // 获取专题详细信息
        info: 'http://xgsj-dowding-dev.istarshine.net.cn/dowBack/getEditSubjectInfo?token=55610c9a0fd9e172d6f64e999f6781ec&id='
    },
    dowdingAdminHosts: "http://admin-dowding-dev.istarshine.net.cn/node-api/"
}