// pages/namesakeList/namesakeList.js 同名人物公司列表
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
const app = getApp()

Page({
  data: {
      isLoading: true,
      isNoData: false,
      companyList:[],
      companyListBackup:[],
      coreInfo:{},
      selectedList:[],
      curPage: 1,    //分页请求
      totalPage: null,    //总页数
  },
  onLoad: function (options) {
    let personId = options && options.personId
    let personName = options && options.personName
    this.setData({
      coreInfo:{
        id: personId,
        name: personName,
        type: "Person"
      }
    })
    this.getCompanyList(personId)
  },
  getCompanyList: function (personId){
    let that = this
    httpRequest({
      url: get_api_user + '/tkyc/listCompany',
      data: {
        "termList": [
          personId
        ],
        "page": that.data.curPage,
        "size": 10,
        "paramListCompanyRoleScore": 1,
        "propertyPath": "Person.id",
        "kgExpectTypeList": [
          "Company"
        ]
      },
      method: 'POST',
    }).then((res) => {
      console.log('同名人物公司', res)
      let results = res.kgObjectList
      if (results && results.length) {
        let totalPage = Math.ceil(res.kgResultTotal / 10)
        let companyData = that.data.companyList || [];
        results.forEach(item => {
          if (item.extType['-1'] && item.extType['-1'].editType === 'SYS'
            || item.extType['-1'].editType === 'ADD') {
            //item['disableCompany'] = true
            item['checked'] = true
          }
          item['confidence'] = item.extType['-1'] && item.extType['-1'].score
          companyData.push(item)
        })

        that.setData({
          isLoading: false,
          companyList: companyData,
          companyListBackup: JSON.parse(JSON.stringify(companyData)),
          totalPage: totalPage
        })
      }else{
        that.setData({
          isLoading: false,
          isNoData: true
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    }) 
  },
  saveMerge: function(e){
      let that = this;
      let coreInfo = that.data.coreInfo;
      let list = that.data.companyList; //that.data.selectedList;
      let oldList = that.data.companyListBackup;
      let changeArr = list.filter((item, index) => {
          return item.checked != oldList[index].checked
      })

      let params = []
      changeArr.forEach(item => {
        params.push({
          'type': 'singleMemberEdit',
          'checked': item.checked,
          'memberId': item['@id'],
          'memberName': item.name,
          'extType': item.extType
        })
      })
      
      if (changeArr.length) {
        httpRequest({
          url: get_api_user + '/tkyc/companyGroupEdit', //'/patches/batchSave',
          data: {
            "coreMemberId": that.data.coreInfo.id,
            "coreMemberType": that.data.coreInfo.type,
            "patches": params
          },
          method: 'POST',
        }).then((res) => {
          app.globalData.groupEditStatus = true
          wx.showToast({
            title: '保存成功',
          })
          wx.navigateBack({
            delta: 1
          })
        }).catch((errMsg) => {
          console.log(errMsg);//错误提示信息
        }) 
     }else{
       wx.showToast({
         title: '您还没有编辑任何企业哦～',
         icon: 'none',
         duration: 2000
       })
     }
  },
  addMember: function(list){
    let that = this
    let params = []
    list.forEach(item => {
      let detail = {}
      detail['patchType'] = 'ADD';
      detail["objectCategory"] = "Link";
      detail["objectId"] = null
      detail['objectType'] = "coreMember"
      detail['objectDetails'] = {
        "in": {
          "@id": that.data.coreInfo.id,
          "@type": [
            "Person", "Thing"
          ],
          "name": that.data.coreInfo.name
        },
        "out": {}
      }
      detail['objectDetails']['out']['@id'] = item['@id']
      detail['objectDetails']['out']['name'] = item.name;
      detail['objectDetails']['out']['extType'] = {
        "-1": item.extType['-1'] 
      }
      detail['objectDetails']['out']['@type'] = ["Company", "Thing"]
      params.push(detail)
    })
    return params;
  },
  // 删除企业集合成员
  deleteMember: function (list) {
    let that = this
    let params = []
    list.forEach(item => {
        let detail = {}
        detail['patchType'] = 'UPDATE';
        detail["objectCategory"] = "Link";
        detail["objectId"] = null
        detail['objectType'] = "coreMember"
        detail['objectDetails'] = {
          "in": {
            "@id": that.data.coreInfo.id,
            "@type": [
              "Person", "Thing"
            ],
            "name": that.data.coreInfo.name
          },
          "out": {},
          "editType": "DEL"
        }
        detail['objectDetails']['out']['@id'] = item['@id']
        detail['objectDetails']['out']['name'] = item.name;
        detail['objectDetails']['out']['extType'] = {
          "-1": item.extType['-1'] 
        }
        detail['objectDetails']['out']['@type'] = ["Company", "Thing"]
        params.push(detail)
    })
    return params;
  },
  // 下拉加载分页
  onReachBottom: function () {
    var curPage = this.data.curPage;
    var totalPage = this.data.totalPage;
    curPage++;
    if (curPage > totalPage) {
      wx.showToast({
        title: '没有更多数据啦~',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    this.setData({
      companyLoading: true,
      curPage: curPage
    })
    this.getCompanyList(this.data.coreInfo.id)
  },
  // 选择
  select: function (e) {
    var that = this;
    let disable = e.currentTarget.dataset.disable;
    if (disable){
      wx.showToast({
        title: '该企业已返回，无需再次添加',
        icon: 'none',
        duration: 2000
      })
      return
    }
    let arr2 = [];
    var arr = that.data.companyList;
    var index = e.currentTarget.dataset.id;
    arr[index].checked = !arr[index].checked;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr2.push(arr[i])
      }
    };
    that.setData({
      companyList: arr,
      selectedList: arr2
    })
  },
})