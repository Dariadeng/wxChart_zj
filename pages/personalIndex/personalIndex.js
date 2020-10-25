//index.js
//获取应用实例
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
const app = getApp()
const reg = /^[\u4E00-\u9FA5]{4,20}$/;
var wayIndex = -1;
var school_area = '';
var grade = '';
// 当联想词数量较多，使列表高度超过340rpx，那设置style的height属性为340rpx，小于340rpx的不设置height，由联想词列表自身填充
// 结合上面wxml的<scroll-view>
var arrayHeight = 0;

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    searchValue: '',
    inputValue: '', //点击结果项之后替换到文本框的值
    adapterSource: [], //本地匹配源
    bindSource: [], //绑定到页面的数据，根据用户输入动态变化
    hideScroll: true,
    inputFlag: false,// 是否输入关键词
    searchRecord: [] // 历史搜索
  },
  bindinput: function (e) {
    var prefix = e.detail.value
    this.setData({
      inputValue: prefix
    })
  },
  bindconfirm: function(){
    if (!this.data.inputValue){
      return
    }
    wx.navigateTo({
      url: '../characterEntityList/characterEntityList?name=' + this.data.inputValue
    })
  },
  bindsearch: function(){
    if (!this.data.inputValue) {
      return
    }
    wx.navigateTo({
      url: '../characterEntityList/characterEntityList?name=' + this.data.inputValue
    })
  },
  onLoad: function () {

  },
  onShow: function(){
    this.setData({
      inputValue: ''
    })
  }
})
