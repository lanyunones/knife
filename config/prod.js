module.exports = {
    mysql: {
        dowding: {
            host: "xgks-mysql.istarshine.net.cn",
            user: "dowdingadmin",
            port: '3306',
            password: "dowding2099!",
            database: "dowding",
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            timezone: 'local',
            charset: 'utf8mb4',
            dateStrings: 'date'
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
    },
    redis: {
        dowding: {
            host: "dowding-redis-1.istarshine.net.cn",
            port: 6379,
            db: 8,
        },
        errCode: {
            host: "dowding-redis-1.istarshine.net.cn",
            port: 6379,
            db: 1,
        }
    }
}