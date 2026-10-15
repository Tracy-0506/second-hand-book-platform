const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config');

let tokenCache = { value: '', expiresAt: 0 };
let tokenRequest = null;

async function getAccessToken() {
  if (!config.contentSafetyEnabled) return null;
  if (!config.wxAppId || !config.wxSecret) throw new Error('内容安全审核已开启，但未配置 WX_APPID 或 WX_SECRET');
  if (tokenCache.value && tokenCache.expiresAt > Date.now()) return tokenCache.value;
  if (!tokenRequest) {
    tokenRequest = axios.get('https://api.weixin.qq.com/cgi-bin/token', { params: { grant_type: 'client_credential', appid: config.wxAppId, secret: config.wxSecret } })
      .then(response => {
        if (response.data.errcode || !response.data.access_token) throw new Error(`微信 access_token 获取失败：${response.data.errmsg || response.data.errcode}`);
        tokenCache = { value: response.data.access_token, expiresAt: Date.now() + Math.max(60, response.data.expires_in - 300) * 1000 };
        return tokenCache.value;
      }).finally(() => { tokenRequest = null; });
  }
  return tokenRequest;
}

function assertPass(result, type) {
  if (result.errcode) throw new Error(`微信${type}接口失败：${result.errmsg || result.errcode}`);
  if (result.result?.suggest && result.result.suggest !== 'pass') {
    const error = new Error(`内容审核未通过：${result.result.suggest}`);
    error.code = 'CONTENT_REJECTED';
    throw error;
  }
}

async function checkText({ content, openid }) {
  if (!config.contentSafetyEnabled) return;
  if (!content || !content.trim()) return;
  const accessToken = await getAccessToken();
  const response = await axios.post('https://api.weixin.qq.com/wxa/msg_sec_check', { content: content.trim(), version: 2, scene: 2, openid }, { params: { access_token: accessToken }, timeout: 8000 });
  assertPass(response.data, '文本内容安全');
}

async function checkImage(filePath, openid) {
  if (!config.contentSafetyEnabled) return;
  const accessToken = await getAccessToken();
  const form = new FormData();
  form.append('media', fs.createReadStream(filePath));
  const response = await axios.post('https://api.weixin.qq.com/wxa/img_sec_check', form, { params: { access_token: accessToken }, headers: form.getHeaders(), maxBodyLength: 10 * 1024 * 1024, timeout: 15000 });
  assertPass(response.data, '图片内容安全');
}

module.exports = { checkText, checkImage };
