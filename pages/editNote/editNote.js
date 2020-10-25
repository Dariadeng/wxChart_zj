// pages/editNote/editNote.js 自定义备注页面
import { get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'

Page({

  data: {
    inputValue: '',
    editId:''
  },

  onLoad: function (options) {
     this.setData({
       editId: options && options.id,
       inputValue: options && options.name
     })
  },
  bindinput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  saveNote: function(){
    let that = this
    httpRequest({
      url: get_api_user + '/patches/batchSave',
      data: [{
          "patchType": "UPDATE",
          "tag": "CompanyRemark",
          "objectCategory": "Node",
          "objectId": that.data.editId,
          "objectType": "Company",
          "objectDetails": {
            "remark": {
              "name": that.data.inputValue
            }
          }
      }],
      method: 'POST',
    }).then((res) => {
      console.log('备注',res)
      wx.showToast({
        title: '保存成功',
      })
      getApp().globalData.monitorEditStatus = true
      wx.navigateBack({
        delta: 1
      })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  }
})