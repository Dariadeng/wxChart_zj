import { get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'

Page({
  data: {
    isVipFlag: false,  // 是否是vip
    wxAccount:''
  },
  onLoad: function (options) {
     this.setData({
        wxAccount: options && options.wxAccount,
        isVipFlag: options && JSON.parse(options.isVipMember)
     })
  },
  // 支付
  bindPay: function(){
    httpRequest({
        url: get_api_user + '/vip/order/create',
        data: {},
        method: 'POST'
    }).then((result) => {
      //console.log('支付', result)
      wx.requestPayment({
          'timeStamp': result.timeStamp,
          'nonceStr': result.nonceStr,
          'package': result.packageValue,
          'signType': result.signType,
          'paySign': result.paySign,
          'success': function (res) { 
            httpRequest({
              url: get_api_user + '/vip/order/status',
              data: {
                'tradeNo': result.tradeNo
              },
              method: 'GET'
            }).then((statusRes) => {
                //console.log('支付成功', statusRes)
              if (statusRes && statusRes.paymentStatus == 'Success'){
                wx.showToast({
                  title: '支付成功',
                  mask: true
                })
                let refresh_token = wx.getStorageSync('refresh_token')
                wx.request({
                  url: get_api_user + '/oauth/refreshToken',
                  method: 'POST',
                  data: {
                    "refreshToken": refresh_token
                  },
                  header: {},
                  success: function (tokenRes) {
                    let results = tokenRes && tokenRes.data
                    console.log('更新refreshToken', tokenRes)
                    const code = tokenRes.statusCode.toString()
                    if (code === '500') {
                      wx.removeStorageSync({
                        key: 'access_token'
                      })
                      wx.removeStorageSync({
                        key: 'refresh_token'
                      })
                      wx.showModal({
                        title: '提示',
                        content: '登录信息已过期，是否重新登录？',
                        success: function (res) {
                          console.log(res)
                          if (res.confirm) {
                            wx.navigateTo({
                              url: '../loginIndex/loginIndex'
                            })
                          }
                        }
                      })
                    } else {
                      wx.setStorage({
                        key: 'access_token',
                        data: results.access_token,
                      })
                      wx.setStorage({
                        key: 'refresh_token',
                        data: results.refresh_token,
                      })
                    }
                  }
                })
              }else{
                wx.showToast({
                  title: '支付失败'
                })
              }
            }).catch((errMsg) => {
              console.log(errMsg);//错误提示信息
            });
          },
          'fail': function (res) { 

          },
          'complete': function (res) { }
        })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  }
})