// 验证邮箱
export function validateEmail(email) {
  const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  return reg.test(email);
}

// 验证手机号
export function validatePhone(phone) {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

// 验证密码强度 (至少8位，包含大小写字母和数字)
export function validatePassword(password) {
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return reg.test(password);
}

// 验证用户名 (4-20位字母、数字、下划线、减号)
export function validateUsername(username) {
  const reg = /^[a-zA-Z0-9_-]{4,20}$/;
  return reg.test(username);
}

// 字符串是否为空
export function isEmpty(str) {
  return str === undefined || str === null || str === '';
} 