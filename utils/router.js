// 页面跳转超过限制次数
module.exports = {
  navigateTo(object) {
    if (getCurrentPages().length > 9) {
      wx.showModal({
        title: '提示',
        content: '跳转次数已超上限，如果继续跳转，将无法返回当前页面。是否继续？',
        success: function (res) {
          if (res.confirm) {
            wx.reLaunch(object)
          } else {
            console.log('用户点击了取消')
          }
        }
      })
      //wx.redirectTo(object)
    } else {
      wx.navigateTo(object)
    }
  }
}
