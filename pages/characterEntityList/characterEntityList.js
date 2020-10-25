// pages/namesakeList/namesakeList.js
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'

Page({
  data: {
    resultTotal: 0,
    entityList:[],
    inputValue:'',
    inputFlag: true,
    isNoData: false,
    isLoad: true
  },
  onLoad: function (options) {
    let name = options && options.name
    this.setData({
      inputValue: name
    })
    if (wx.getStorageSync('access_token')) {
      this.getPersonListByToken(name)
    }else{
      this.getPersonList(name)
    }
  },
  bindinput: function (e) {
    var prefix = e.detail.value
    this.setData({
      inputValue: prefix
    })
  },
  bindconfirm: function () {
    if (!this.data.inputValue) {
      return
    }
    this.setData({
      isLoad: true,
      isNoData: false,
    })
    if (wx.getStorageSync('access_token')) {
      this.getPersonListByToken(this.data.inputValue)
    } else {
      this.getPersonList(this.data.inputValue)
    }
  },
  bindsearch: function () {
    if (!this.data.inputValue) {
      return
    }
    this.setData({
      isLoad: true,
      isNoData: false,
    })
    if (wx.getStorageSync('access_token')) {
      this.getPersonListByToken(this.data.inputValue)
    } else {
      this.getPersonList(this.data.inputValue)
    }
  },
  // 清空输入框的内容
  bindDelete: function () {
    let that = this
    that.setData({
      inputValue: '',
      inputFlag: false
    })
  },
  getPersonList: function(name){
    let that = this
    wx.request({
      url: get_api_url + '/tkyc/listPerson',
      method: 'POST',
      data: {
        "name": name.trim(), // "雷军"
        "equiv": [] 
      },
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
         let results = res.data;
         if (results && results.kgObjectList){
            that.setData({
                entityList: results.kgObjectList,
                resultTotal: results.kgResultTotal,
                inputFlag: true,
                isNoData: false,
                isLoad: false
            })
         }else{
            that.setData({
               inputValue: name,
               inputFlag: true,
               isNoData: true,
               isLoad: false
            })
         }
      }
    })
  },
  getPersonListByToken: function (name) {
    let that = this
    httpRequest({
      url: get_api_user + '/tkyc/listPerson',
      method: 'POST',
      data: {
        "name": name.trim(), // "雷军"
        "equiv": []
      },
    }).then((res) => {
      let results = res;
      if (results && results.kgObjectList) {
        that.setData({
          entityList: results.kgObjectList,
          resultTotal: results.kgResultTotal,
          inputFlag: true,
          isNoData: false,
          isLoad: false
        })
      } else {
        that.setData({
          inputValue: name,
          inputFlag: true,
          isNoData: true,
          isLoad: false
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  toGroupPage: function(e){
    let name = e.currentTarget.dataset.name
    let corePerson = {
      name: name,
      id: e.currentTarget.dataset.id
    }
    getApp().router.navigateTo({
      url: '../characterGroup/characterGroup?groupType=Person&personName=' + name + '&corePerson=' + JSON.stringify(corePerson)
    })
  }
})