// 模糊匹配的公司结果页面
import { get_api_url } from '../../utils/config.js' 
import { numFormat, formatDate } from '../../utils/util.js'
const getInf = (str, key) => str.replace(new RegExp(`${key}`, 'g'), `%%${key}%%`).split('%%');

Page({
  data: {
    companyList: [],
    isLoad: true,
    isNoData: false,
    keyName:'',
    searchRecord:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getCompanyList(options)
    // 是否登陆? 未登陆则获取本地历史记录
    if (!wx.getStorageSync('access_token')) {
      this.openHistorySearch();
    }
  },
  // 获取访客本地历史记录
  openHistorySearch: function () {
    this.setData({
      searchRecord: wx.getStorageSync('searchRecord') || [],//若无储存则为空
    })
  },
  getCompanyList: function (options){
    let that = this;
    that.setData({
      keyName: options.name
    })
    let payload = {
      "query": options.name
    }
    wx.request({
      url: get_api_url + '/entities/search',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data.result && res.data.result.itemListElement
        if (results && results.length) {
          results.forEach(item => {
            item.result['comName'] = getInf(item.result.name, options.name)
            item.result.saicRegistrationStatus = item.result.saicRegistrationStatus.replace(/\（.*?\）/g, '')
            if (item.result.saicRegistrationCapital.value) {
              item.result.saicRegistrationCapital.value = numFormat(item.result.saicRegistrationCapital.value)
            } else {
              item.result.saicRegistrationCapital.value = '未公开'
            }
          })
        }
        if (results) {
          that.setData({
            isLoad: false,
            companyList: results,
          })
        } else {
          that.setData({
            isLoad: false,
            isNoData: true
          })
        }
      }
    })
  },
  //跳转企业详情页面
  toDetailPage: function(e){
    let that = this
    let name = e.currentTarget.dataset.name
    // if (!wx.getStorageSync('access_token')) {
      that.saveRecordFuc(e.currentTarget.id, e.currentTarget.dataset.name)

    // wx.navigateTo({
    //   url: '../ companyFilter/ companyFilter?name=' + name
    // })
    getApp().router.navigateTo({
      url: '../characterGroup/characterGroup?groupType=Company&companyCoreId=' + e.currentTarget.id
        + '&companyCoreName=' + name
    })
  },
  saveRecordFuc: function (comId, comName){
    let searchRecord = this.data.searchRecord
    let time = formatDate();
    let flag = false
    searchRecord.forEach((item, index) => {
      if (item.id === comId) {
        // 删除已存在后重新插入至数组
        flag = true
        searchRecord.splice(index, 1)
        searchRecord.unshift({
          'companyName': comName,
          'id': comId,
          'createAt': time
        })
      }
    })
    if (!flag) {
      //将搜索值放入历史记录中,只能放前五条
      if (searchRecord.length < 5) {
        searchRecord.unshift(
          {
            'companyName': comName,
            'id': comId,
            'createAt': time
          }
        )
      } else {
        searchRecord.pop()//删掉旧的时间最早的第一条
        searchRecord.unshift(
          {
            'companyName': comName,
            'id': comId,
            'createAt': time
          }
        )
      }
    }
    //将历史记录数组整体储存到缓存中
    wx.setStorageSync('searchRecord', searchRecord)
  }
})