import { get_api_user } from './config.js'

const tips = {
  1: '抱歉，出现了一个错误',
  2: '用户信息已过期，请重新登陆！'
}
// # 解构
//   class HTTP {
const request = ({
  url,
  data = {},
  method = 'GET'
})=> {
  return new Promise((resolve, reject) => {
    _request(url, resolve, reject, data, method)
  })
}

const requestNoAuth = ({
  url,
  data = {},
  method = 'GET'
})=> {
  return new Promise((resolve, reject) => {
    _requestNoAuth(url, resolve, reject, data, method)
  })
}
// 需要token的请求
const _request = (url, resolve, reject, data = {}, method = 'GET', noRefetch = false)=> {
  wx.request({
    // url: api.baseUrl + url,
    url: url,
    method: method,
    data: data,
    header: {
      'content-type': 'application/json',
      Authorization: _encode()
    },
    success: (res) => {
      const code = res.statusCode.toString()
      if (code.startsWith('2') || code == '400') {
        resolve(res.data)
      } else {
        if (code == '401' || code == '403' ) {
          if (!noRefetch) {
            _refetch(
              url,
              resolve,
              reject,
              data,
              method
            )
          }
        } else {
          reject()
          console.log('报错信息', res.data)
          const error_code = res.data.status
          _show_error('报错:' + code + '信息:' + res.data.message)
          //_show_error(error_code)
        }
      }
    },
    fail: (err) => {
      reject()
      console.log('报错信息', err)
      _show_error(err)
      //_show_error(1)
    }
  })

}

// 不需要token的请求
const _requestNoAuth = (url, resolve, reject, data = {}, method = 'GET', noRefetch = false)=> {
  wx.request({
    url: url,
    method: method,
    data: data,
    success: (res) => {
      const code = res.statusCode.toString()
      if (code.startsWith('2')) {
        resolve(res.data)
      } else {
        reject()
        const error_code = res.data.error_code
        _show_error(error_code)
      }
    },
    fail: (err) => {
      reject()
      _show_error(1)
    }
  })

}

const _show_error = (error_code)=> {
  // if (!error_code) {
  //   error_code = 1
  // }
  const tip = tips[error_code]
  wx.showToast({
    title: error_code,   //tip ? tip : tips[1],
    icon: 'none',
    duration: 2000
  })
}

const _refetch = (...param)=> {
  var token = ''  //new Token();
  let refresh_token = wx.getStorageSync('refresh_token')
  wx.request({
    url: get_api_user + '/oauth/refreshToken',
    method: 'POST',
    data: {
      "refreshToken": refresh_token
    },
    header: {
      //Authorization: 'Bearer ' + refresh_token
    },
    success: function (res) {
      let results = res.data
      const code = res.statusCode.toString()
      if (code === '500'){
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
      }else{
        token = results.access_token
        wx.setStorage({
          key: 'access_token',
          data: results.access_token,
        })
        _request(...param, true);
        wx.setStorage({
          key: 'refresh_token',
          data: results.refresh_token,
        })
      }
    },
    fail: (err) => {
      reject()
      _show_error(2)
    }
  })
  // token.getTokenFromServer((token) => {
  //   this._request(...param, true);
  // });
}

const _encode = ()=> {
  const token = wx.getStorageSync('access_token')
  return 'Bearer ' + token
}


//   }

module.exports = {
  httpRequest: request,
  requestNoAuth: requestNoAuth
}