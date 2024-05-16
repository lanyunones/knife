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
        }
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