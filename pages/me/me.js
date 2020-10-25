// pages/me/me.js
import { get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { formatDate } from '../../utils/util.js'

Page({
  data: {
    avatarUrl: '../../images/icon_touxiang.png',
    userInfo: { nickName:'用户昵称'},
    isLogin: false,
    isFristLoad: true,
    userPhone: '',
    isVipMember: false,
    vipExpireAt: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (wx.getStorageSync('access_token')){
       this.setData({
         userPhone: wx.getStorageSync('phoneObj'),
         isLogin: true
       })
       this.getUserDetail();
     }
  },
  toLoginPage: function(){
    wx.navigateTo({
      url: '../loginIndex/loginIndex'
    })
  },
  outLogin:function(){  // 退出登录
    let that = this
    wx.showModal({
      title: '提示',
      content: '是否立即退出？',
      success: function (res) {
        console.log(res)
        if (res.confirm) {
          wx.clearStorageSync({
            key: 'access_token'
          })
          wx.clearStorageSync({
            key: 'refresh_token'
          })
          wx.clearStorageSync({
            key: 'userVipInfo'
          })
          that.setData({
             isVipMember: false,
             isLogin: false,
             avatarUrl: '../../images/icon_touxiang.png'
             
          })
        } 
      }
    })
  },
  onShow: function(){
    if (!this.data.isFristLoad && wx.getStorageSync('access_token')) {
      this.setData({
        userPhone: wx.getStorageSync('phoneObj'),
        isLogin: true
      })
      this.getUserDetail();
    } else{
      this.setData({
        isFristLoad: false
      })
    }
  },
  getUserDetail: function(){
    httpRequest({
      url: get_api_user + '/users/me',
      data: {},
      method: 'GET'
    }).then((res) => {
      // console.log('用户信息', res)
      if (res && res.roles && res.roles.length && res.roles[0].authority.includes('ROLE_VIP')){
        wx.setStorage({
          key: 'userVipInfo',
          data: res.roles[0],
        })
        let curDate = new Date().getTime();
        let time = res.roles[0].expireAt && res.roles[0].expireAt.trim().split(" ")[0]
        let createTime = new Date(res.roles[0].expireAt).getTime()
        if (curDate < createTime){
          this.setData({
            isVipMember: true,
            vipExpireAt: time
          })
        }else{
          wx.showModal({
            title: '提示',
            content: '是否重新续费？',
            success: function (res) {
              if (res.confirm) {
                wx.navigateTo({
                  url: '../vipDescription/vipDescription?isVipMember=' + that.data.isVipMember
                })  
              }
            }
          })
        }
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
             // console.log('用户信息',res)
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
  },
  // toVipPage: function(){
  //   let wxAccount = ''
  //   wx.navigateTo({
  //     url: '../vipDescription/vipDescription?isVipMember=' + this.data.isVipMember
  //   })
  // },
  toAboutUsPage: function(){
    wx.navigateTo({
      url: '../aboutUs/aboutUs'
    })
  },
  toMonitorPage: function () {
    if (wx.getStorageSync('access_token')) {
      wx.navigateTo({
        url: '../monitorList/monitorList'
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '请登录后查看',
        success: function (res) {
          console.log(res)
          if (res.confirm) {
            wx.navigateTo({
              url: '../loginIndex/loginIndex'
            })
          } else {
          }
        }
      })
    }
  },
  toEventPage: function () {
    if (wx.getStorageSync('access_token')) {
        wx.navigateTo({
          url: '../warningEvent/warningEvent'
        })
    } else {
      wx.showModal({
        title: '提示',
        content: '请登录后查看',
        success: function (res) {
          console.log(res)
          if (res.confirm) {
            wx.navigateTo({
              url: '../loginIndex/loginIndex'
            })
          } else {
          }
        }
      })
    }
  }
})