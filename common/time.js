const moment = require('moment');

/**
* 获取两个日期之间所有日期
* @param {*} startDate
* @param {*} endDate
* @returns
*/
function betweenDates(startDate, endDate, format = 'YYYYMMDD') {
    // 假定你已经保证了startDate 小于endDate，且二者不相等
    let daysList = [];
    let SDate = moment(startDate);
    let EDate = moment(endDate);

    if(SDate.diff(EDate) ===0){
        daysList.push(SDate.format(format))
        return daysList
    }
    daysList.push(SDate.format(format));
    while (SDate.add(1, "days").isBefore(EDate)) {  // 注意这里add方法处理后SDate对象已经改变。
        daysList.push(SDate.format(format));
    }
    daysList.push(EDate.format(format));
    return daysList;
}

module.exports = {
    betweenDates
}