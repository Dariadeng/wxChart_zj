const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
// 处理金额
const numFormat = (val)=> {
  if (val.toString().length > 4) {
    let num = Math.round((val / 10000) * 100) / 100;
    val = num + "万元";
  } else {
    return val + "元"
  }
  return val
}

//保留2位小数，如：2，还会保留2 不会补0
const toDecimalNoZero = (x) => {
  var f = Math.round(x * 100000) / 100000;
  var s = f.toString();
  return s;
}

// 处理时间 年月日
const formatDate = () => {
  var timestamp = Date.parse(new Date());
  var date = new Date(timestamp);
  //获取年份  
  var Y = date.getFullYear();
  //获取月份  
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  //获取当日日期 
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  return Y + '-' + M +'-' +D
}

function utcBeijing(utc_datetime) {
  // 转为正常的时间格式 年-月-日 时:分:秒
  var T_pos = utc_datetime.indexOf('T');
  var year_month_day = utc_datetime.substr(0, T_pos);
  var hour_minute_second = utc_datetime.substr(T_pos + 1, utc_datetime.length);
  var new_datetime = year_month_day + " " + hour_minute_second; 
  var datatime = new_datetime.replace(/\-/g, "/") 

  // 处理成为时间戳
  timestamp = new Date(Date.parse(datatime));
  timestamp = timestamp.getTime();
  timestamp = timestamp / 1000;

  // 增加8个小时，北京时间比utc时间多八个时区
  var timestamp = timestamp + 8 * 60 * 60;

  // 时间戳转为时间
  // var beijing_datetime = new Date(parseInt(timestamp) * 1000).toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
  return timestamp; 
}


function HashMap() {
  //定义长度  
  var length = 0;
  //创建一个对象  
  var obj = new Object();

  /** 
  * 判断Map是否为空 
  */
  this.isEmpty = function () {
    return length == 0;
  };

  /** 
  * 判断对象中是否包含给定Key 
  */
  this.containsKey = function (key) {
    return (key in obj);
  };

  /** 
  * 判断对象中是否包含给定的Value 
  */
  this.containsValue = function (value) {
    for (var key in obj) {
      if (obj[key] == value) {
        return true;
      }
    }
    return false;
  };

  /** 
  *向map中添加数据 
  */
  this.put = function (key, value) {
    if (!this.containsKey(key)) {
      length++;
    }
    obj[key] = value;
  };
  /** 
  * 根据给定的Key获得Value 
  */
  this.get = function (key) {
    return this.containsKey(key) ? obj[key] : null;
  };

  /** 
  * 根据给定的Key删除一个值 
  */
  this.remove = function (key) {
    if (this.containsKey(key) && (delete obj[key])) {
      length--;
    }
  };
  /** 
  * 获得Map中的所有Value 
  */
  this.values = function () {
    var _values = new Array();
    for (var key in obj) {
      _values.push(obj[key]);
    }
    return _values;
  };
  /** 
  * 获得Map中的所有Key 
  */
  this.keySet = function () {
    var _keys = new Array();
    for (var key in obj) {
      _keys.push(key);
    }
    return _keys;
  };
  /** 
  * 获得Map的长度 
  */
  this.size = function () {
    return length;
  };
  /** 
  * 清空Map 
  */
  this.clear = function () {
    length = 0;
    obj = new Object();
  };
} 

module.exports = {
  formatTime: formatTime,
  numFormat: numFormat,
  toDecimalNoZero: toDecimalNoZero,
  HashMap: HashMap,
  formatDate: formatDate,
  utcBeijing: utcBeijing
}
