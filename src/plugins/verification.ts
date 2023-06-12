// 验证中文
const verifyChinese = /.*[\u4e00-\u9fa5]+.*$/;
// 验证英文
const verifyEnglish = /.*[a-zA-Z]+.*$/;
// 验证特殊符号
const verifySymbol = /[`~!@#$%^&*()_\-+=<>?:"{}|,/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/;
// 验证: 0-9
const verifyNumber = /^[0-9]*$/;
// 验证：0-9精确小数6位
const verifyNumberFloat = /(^[0-9]*$)|(^[0-9]*\.[0-9]{1,6}$)/;
// 验证：0-9精确小数1位
const verifyNumberFloat1 = /(^[0-9]*$)|(^[0-9]*\.[0-9]{1,1}$)/;
// 验证IP
const verifyIP =
  /^(?=(\b|\D))(((\d{1,2})|(1\d{1,2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{1,2})|(2[0-4]\d)|(25[0-5]))(?=(\b|\D))$/;

// 验证网址
const verifyURL = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
// 验证手机号码
const verifyTel = /^1[0-9][0-9]{9}$/;
// 验证邮箱
const verifyEmail = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;

// 验证只能输入数字以及字母以及下划线
const verifyNumCode = /^[0-9a-zA-Z_]{1,}$/;

// 判断字符串是否是浮点数
const verifyDouble = /^(-?\d+)(\.\d+)?$/;

// 验证大于0的整数
const verifyPositiveInteger = /^[1-9][0-9]*$/;

// 验证大于等于0的整数
const verifyPositiveIntegerZero = /^\d+$/;

// 经度坐标，https://developer.aliyun.com/article/618783
const verifyLng = /^[\-\+]?(0(\.\d{1,10})?|([1-9](\d)?)(\.\d{1,10})?|1[0-7]\d{1}(\.\d{1,10})?|180\.0{1,10})$/;

// 纬度坐标，https://developer.aliyun.com/article/618783
const verifyLat = /^[\-\+]?((0|([1-8]\d?))(\.\d{1,10})?|90(\.0{1,10})?)$/;

// 验证视频ip
const ipReg =
  /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

export {
  verifyChinese,
  verifyEnglish,
  verifySymbol,
  verifyNumber,
  verifyNumberFloat,
  verifyNumberFloat1,
  verifyIP,
  verifyURL,
  verifyTel,
  verifyEmail,
  verifyNumCode,
  verifyDouble,
  verifyPositiveInteger,
  verifyPositiveIntegerZero,
  verifyLng,
  verifyLat,
  ipReg
};
