// pages/loginIndex/loginIndex.js
import { get_api_user} from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'

Page({
  data: {
    istrue: false,
    phoneNumber:'',
    access_token:'',
    refresh_token:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 登录
    let that = this
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        // console.log('code转换', res.code);
        let payload = {
          "code": res.code
        }
        //  获取token
        wx.request({
          url: get_api_user + '/wechat/miniApp/login',
          method: 'POST',
          data: payload,
          header: {
            "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
          },
          success: function (res) {
            console.log(res)
            let results = res.data
            that.setData({
              access_token: results.access_token,
              refresh_token: results.refresh_token
            })
          }
        })
      }
    })
  },
  openDialog: function () {
    this.setData({
      istrue: true
    })
  },
  closeDialog: function () {
    this.setData({
      istrue: false
    })
  },
  getPhoneNumber: function (e) {
    var ivObj = e.detail.iv
    var telObj = e.detail.encryptedData
    var that = this;
    let phoneObj = ''
    // 获取手机号
    wx.request({
        url: get_api_user + '/wechat/miniApp/updatePhone',
        data: {
          encryptedData: telObj,
          iv: ivObj
        },
        header: {
          'content-type': 'application/json',
           Authorization: 'Bearer ' + that.data.access_token
        },
        method: 'POST',
    success: function (res) {
        console.log(res,'用户信息')
        const code = res.statusCode.toString()
        phoneObj = res && res.phone;
        wx.setStorage({
          key: 'phoneObj',
          data: phoneObj,
        })
          //是否授权，授权通过进入主页面，授权拒绝则停留在登陆界面
        if (e.detail.errMsg == 'getPhoneNumber:fail user deny') { //用户点击拒绝
            // wx.navigateTo({
            //   url: '../loginIndex/loginIndex',
            // })
        } else { //允许授权执行跳转
            if (code.startsWith('2')){
               wx.showToast({
                 title: '授权成功',
                 icon: 'success',
                 duration: 2000
               })
               wx.setStorage({
                 key: 'access_token',
                 data: that.data.access_token,
               })
               wx.setStorage({
                 key: 'refresh_token',
                 data: that.data.refresh_token,
               })
               httpRequest({
                 url: get_api_user + '/users/me',
                 data: {},
                 method: 'GET'
               }).then((res) => {
                 if (res && res.roles && res.roles.length && res.roles[0].authority.includes('ROLE_VIP')) {
                   wx.setStorage({
                     key: 'userVipInfo',
                     data: res.roles[0],
                   })
                 }
               }).catch((errMsg) => {
                 console.log(errMsg);//错误提示信息
               });
               let pages = getCurrentPages()  //获取当前页面栈的信息
               let prevPage = pages[pages.length - 2]   //获取上一个页面
               prevPage.setData({   //把需要回传的值保存到上一个页面
                 isLogin: true
               });
               wx.navigateBack({
                 delta: 1 // 返回上一级页面。
               })
             }else{
              wx.showToast({
                title: '授权失败',
                icon: 'none',
                duration: 2000
              })
             }
          }
      }
    })
  }
})