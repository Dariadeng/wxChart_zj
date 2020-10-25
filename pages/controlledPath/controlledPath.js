// pages/controlledPath/controlledPath.js 实控路径页面
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { toDecimalNoZero } from '../../utils/util.js'

Page({
  data: {
    isLoading: true,
    isNoData: false,
    pathList: [],
    actualController: '',
    type: '',
    totalStock: ''
  },

  onLoad: function (options) {
    
    let begin = options.begin && JSON.parse(options.begin)
    let end = options.end && JSON.parse(options.end)
    this.setData({
      actualController: begin.name || '',
      totalStock: options.totalStock || '',
      type: options.type || ''
    })
    this.getControllPath(begin, end)
  },
  // 获取实控路径
  getControllPath: function(begin, end){
    let that = this;
    wx.request({
      url: get_api_url + '/tkyc/listEquityPath',
      data: {
        "nameEntityBegin": begin.name,
        "idEntityBegin": begin.id,
        "nameEntityEnd": end.name,
        "idEntityEnd": end.id
      },
      method: 'POST',
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data
        let totalRatio = 0
        if (results != undefined) {
          if (results.kgObjectList && results.kgObjectList.length){
            results.kgObjectList.forEach((kgItem,kgIndex)=> {
              kgItem.forEach((item,index) => {
                item['realRatio'] = toDecimalNoZero(item.ratio * 100)
                if (index === 0){
                  totalRatio += item.ratio;
                }
              }) 
            })
            // 自建规则类型计算 总共持股
            if (that.data.type == 'self'){
              totalRatio = toDecimalNoZero(totalRatio*100)
              that.setData({
                totalStock: totalRatio > 100 ? 100: totalRatio
              })
            }
            that.setData({
              pathList: results.kgObjectList 
            })
          }
        } else {

        }
      }  
    });
  },

})