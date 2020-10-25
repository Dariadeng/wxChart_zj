//app.js
import { get_api_user } from './utils/config.js'
import router from './utils/router.js'
import { httpRequest } from './utils/httpUtil.js'

App({
  router,
  onLaunch: function () {
    let that = this;
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (!wx.getStorageSync('access_token')) {
      // 获取用户默认配置
      wx.request({
        url: get_api_user + '/profiles/CompanyGroupMatchParam/default',
        data: {},
        method: 'GET',
        success: function(res){
          getApp().globalData.companyGroupMatchParam = res.data.properties 
        }
      })
    } else {
      console.log('已登陆')
      // 获取用户自定义配置
      httpRequest({
        url: get_api_user + '/profiles/CompanyGroupMatchParam',
        data: {},
        method: 'GET',
      }).then((res) => {
          getApp().globalData.companyGroupMatchParam = res.properties
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      })
    }
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

    // 版本更新
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })
          updateManager.onUpdateFailed(function () {
            wx.showModal({
              title: '新版本已经准备好',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~'
            })
          })
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },
  // 全局变量
  globalData: {
    userInfo: null,
    groupEditStatus: false,  // 是否编辑了企业集合
    monitorEditStatus: false,
    expendEditStatus: false,
    addEditStatus: false,
    groupCaseIds: [],// 企业集合案件列表id(入参)
    companyCaseId:[],  // 单体企业案件id
    coreMemberCompany: {},  // 核心企业
    coreGroupCompany:[],   // 企业集团 核心企业
    coreGroupCompanyName: [],   // 企业集团 核心企业 名称
    isAddGroupMember: false, // 是否进行了添加企业到集合中
    addGroupCompanyList: [],  // 暂存新增的企业数据（排序）
    expendRelationSelectAll: [],  // 拓展关系 全选 集合
    expendRelationNoSelectAll: [], // 拓展关系 全 不 选 集合
    expendRelationNoSelect: {},  //  拓展关系 全选时 未勾选的 
    expendRelationSelect: {},  //  拓展关系 全不选时 勾选的 
    setRangeCancelSelect: null,  // 设置范围页面 编辑过的数据
    isAddCompanyGroup: false,  // 是否新增企业中添加公司 企业集合 到设置范围页面
    coreGroupInfo:{}, // 核心人物 / 核心企业 信息
    companyGroupMatchParam: {}, // 企业集合配置参数
    groupRecordCount: 1,
    apiKey: 'idhOgepvtp6k5B02MJ0F23eZzEL3Q8OT6yo6iaiw',
  }
})