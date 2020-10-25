// pages/refereeList/refereeList.js  暂时无用
import { get_api_url } from '../../utils/config.js'

Page({
  data: {
    sortByName: "排序",
    screenByName: "筛选",
    isLoad: true,
    isNoData: false,
    lawInfo:[]
  },
  onLoad: function (options) {
    this.getDetailData()
  },
  toRefereeDetailPage: function () {  // 跳转裁判文书详情
    wx.navigateTo({
      url: '../refereeDetail/refereeDetail'
    })
  },
  getDetailData: function (options) {
    let that = this;
    // if (!options.name) {
    //   return;
    // }
    let payload = {
      "name": '华为技术有限公司' //options.name //
    }
    wx.request({
      url: get_api_url + '/entityInfoByName',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        console.log(res.data.result)
        let results = res.data.result
        let lawData = [];
        if (results && results.entity) {
          if (results.neighborList) {
            lawData = results.neighborList.filter(item => {
              return item.courtCaseNumber
            })
          }
          that.setData({
            isLoad: false,
            lawInfo: lawData
          })
        } else {
          that.setData({
            isLoad: false,
            isNoData: true
          })
        }
      }
    })
  }
})