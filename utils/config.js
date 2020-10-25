const config = {
  api_base_url:  'https://aq9sihrz84.execute-api.cn-northwest-1.amazonaws.com.cn/demo/v2',//'https://kgapi.ruyi.ai/v2',
  api_user_url: 'https://zhijun.dev.ruyi.ai',
  // 更多的配置项
  // https://virtserver.swaggerhub.com/lidingpku/kgapi/1.0.0/ckyc/
  api_kg_url: 'https://kgapi.ruyi.ai/v0'
}
module.exports = {
  get_api_url: config.api_base_url,
  get_api_user: config.api_user_url,
  get_api_kg: config.api_kg_url
}