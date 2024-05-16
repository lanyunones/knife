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
    }
}