// pages/selfBuiltRules/selfBuiltRules.js 自建规则页面
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'

Page({
  data: {
    coreCompanyNameList: [],
    rolesList:[
      { name: '股东关系', id: 1, checked: true },
      { name: '对外投资关系', id: 2, checked: true },
      { name: '地址相近关系', id: 4,checked: true },
      { name: '字号相同关系', id: 3,checked: true },
      { name: '人物相同关系', id: 5,checked: true },
    ]
  },

  onLoad: function (options) {
      this.setData({
        coreCompanyNameList: options && options.coreCompanyNameList
      })
      this.getSelfProfiles();
  },
  getSelfProfiles: function(){
    httpRequest({
      url: get_api_user + '/profiles/CompanyGroupMatchParam',
      data: {},
      method: 'GET',
    }).then((res) => {
      getApp().globalData.companyGroupMatchParam = res.properties
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 选择
  select: function (e) {
    var that = this;
    var arr = that.data.rolesList;
    var index = e.currentTarget.dataset.id;
    arr[index].checked = !arr[index].checked;
    that.setData({
      rolesList: arr
    })
  },
  toRolesDetailPage: function(e){
    var index = e.currentTarget.dataset.id;
    getApp().router.navigateTo({
      url: '../selfRolesDetail/selfRolesDetail?expandType=' + index + '&coreCompanyNameList=' + this.data.coreCompanyNameList
    })
  }
})