// pages/searchRecord/searchRecord.js -搜索页面，历史搜索，热门搜索
import { get_api_url, get_api_user} from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { formatDate } from '../../utils/util.js'
const reg = /^[\u4E00-\u9FA5]{4,20}$/;

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    searchValue: '',
    inputValue: '', //点击结果项之后替换到文本框的值
    adapterSource: [], //联想匹配源
    bindSource: [], //绑定到页面的数据，根据用户输入动态变化
    hideScroll: true,
    inputFlag: false,// 是否输入关键词
    companyFocus: false,
    isNoData: false,
    showRecord: true,
    isFristLoad: true,
    searchRecord: [], // 历史搜索
    hotSearchData: []  // 热门搜索
  },
  onLoad: function () {
    this.getHotSearch();
    this.setData({
      companyFocus: true
    })
    // 是否登陆? 未登陆则获取本地历史记录
    if (wx.getStorageSync('access_token')) {
      this.getViewHistory()
    } else {
      this.openHistorySearch();
    }
  },
  onShow: function(){
    if (!this.data.isFristLoad){
        if (wx.getStorageSync('access_token')) {
          this.getViewHistory()
        } else {
          this.openHistorySearch();
        }
        this.setData({
          isFristLoad: false
        })
    }else{
      this.setData({
        isFristLoad: false
      })
    }
  },
  // 获取热门搜索
  getHotSearch: function(){
    let that = this;
    wx.request({
      url: get_api_user + '/companyGroups/hot',
      data: {},
      method: 'GET',
      success: function (res) {
        that.setData({
          hotSearchData: res.data || []
        })
      }
    })
  },
  // 获取访客本地历史记录
  openHistorySearch: function () { 
    this.setData({
      searchRecord: wx.getStorageSync('searchRecord') || [],//若无储存则为空
    })
  },
  // 获取用户历史记录
  getViewHistory: function(){
    let that = this;
    httpRequest({
      url: get_api_user + '/companyGroups/viewHistory',
      data: {},
      method: 'GET',
    }).then((res) => {
      let results = res
      if (results && results.length) {
        results.forEach(item => {
          item.createAt = item.createAt && item.createAt.trim().split(" ")[0]
        })
      }
      that.setData({
        searchRecord: results || []
      })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  //当键盘输入时，触发input事件
  bindinput: function (e) {
    var that = this;
    //用户实时输入值
    var prefix = e.detail.value
    that.setData({
      searchValue: prefix,
      inputFlag: true
    })
    if (!prefix) { // 软键盘
      this.setData({
        bindSource: [],
        inputFlag: false
      })
    }
    if (!reg.test(prefix)) {  // 搜索名称至少四个字
      return;
    }
    clearTimeout(that.timer);
    that.timer = setTimeout(function () {
      //匹配的结果
      var newSource = []
      wx.showLoading({
        title: '搜索中...',
      })
      wx.request({
        url: 'https://kgapi.ruyi.ai/v2/analyzeEntities/stdCompany/single?text=' + e.detail.value + '&size=3',
        method: 'GET',
        header: {
          "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
        },
        success: function (res) {
          let results = res.data.result
          if (results && results.itemListElement && results.itemListElement.length) {
            that.setData({
              showRecord: false,
              adapterSource: results.itemListElement
            })
            if (prefix != "") {
              // 对于数组array进行遍历，功能函数中的参数 `e`就是遍历时的数组元素值。
              that.data.adapterSource.forEach(function (item) {
                // 用户输入的字符串如果在数组中某个元素中出现，将该元素存到newSource中
                if (item.result.name.indexOf(prefix) != -1) {
                  newSource.push(item)
                }
              })
            } else {
              that.data.inputValue = ''
            };
          } else {
            that.setData({
              adapterSource: []
            })
          }
          // 如果匹配结果存在，那么将其返回，相反则返回空数组
          if (newSource.length != 0) {
            that.setData({
              // 匹配结果存在，显示自动联想词下拉列表
              hideScroll: false,
              bindSource: newSource,
              arrayHeight: newSource.length * 71
            })
          } else {
            that.setData({
              // 匹配无结果，不现实下拉列表
              hideScroll: true,
              bindSource: []
            })
          }
          wx.hideLoading()
        }
      })

    }, 200)
  },
  // 点击搜索，如果输入框具体公司模糊匹配，否则跳详情页面。
  bindsearch: function (e) {
    let that = this
    if (!that.data.searchValue) {
      return
    }
    wx.navigateTo({
      url: '../searchResult/searchResult?name=' + that.data.searchValue
    })
  },
  bindconfirm: function (e) {
    let that = this
    if (!that.data.searchValue) {
      return
    }
    wx.navigateTo({
      url: '../searchResult/searchResult?name=' + that.data.searchValue
    })
  },
  // 清空输入框的内容
  bindDelete: function () {
    let that = this
    that.setData({
      inputValue: '',
      bindSource: [],
      inputFlag: false
    })
  },
  // 用户点击选择某个联想字符串时，获取该联想词，并清空提醒联想词数组
  itemtap: function (e) {
    getCurrentPages().pop();
    let inputVal = this.data.searchValue
    let searchRecord = this.data.searchRecord
    let comName = e.currentTarget.dataset.name;
    let type = e.currentTarget.dataset.type;
    let time = formatDate();
    let flag = false
    searchRecord.forEach((item, index) => {
      if (item.id === e.currentTarget.id) {
        // 删除已存在后重新插入至数组
        flag = true
        searchRecord.splice(index, 1)
        searchRecord.unshift({
          'companyName': comName,
          'id': e.currentTarget.id,
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
            'id': e.currentTarget.id,
            'createAt': time
          }
        )
      } else {
        searchRecord.pop()//删掉旧的时间最早的第一条
        searchRecord.unshift(
          {
            'companyName': comName,
            'id': e.currentTarget.id,
            'createAt': time
          }
        )
      }
    }
    //将历史记录数组整体储存到缓存中
    wx.setStorageSync('searchRecord', searchRecord)

    // wx.navigateTo({
    //   url: '../ companyFilter/ companyFilter?name=' + e.currentTarget.id
    // })
    let groupType ={
      'Company': 1,
      'Person': 2
    }
    getApp().router.navigateTo({
      url: '../characterGroup/characterGroup?groupType=Company&companyCoreId=' + e.currentTarget.id
           + '&companyCoreName=' + comName
    })
  }  
})