// pages/addCompanyByCompany/addCompanyByCompany.js 新增企业详情页面
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
const app = getApp()

Page({
  data: {
      serachType: 'Company', //默认为公司类型
      resultTotal:0,
      inputFlag: true,
      isNoData: false,
      isLoading: false,
      inputValue:'',
      selectedList:[],
      entityList:[],
      companyList: [],
      groupCompanyIdList:[],
      companyListBackup:[],
      recentlyAddedData: [],
      coreInfo:{},
      searchFocus: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options){
      wx.setNavigationBarTitle({
        title: options.type == 'Company' ? '搜索企业' : '搜索人物'
      })
      this.setData({
        serachType: options.type,
        // inputValue: options.personName || options.companyName || ''
      })    
    }
    let coreInfo = app.globalData.coreGroupInfo;
    this.setData({
      coreInfo: coreInfo
    })
    // 判断是否企业集合被添加
    this.getGroupEditLogs(coreInfo.id, coreInfo.type);

    // 判断是什么类型的搜索
    // this.getSearch(); 

    // 获取企业集合下所有企业成员，判断搜索出来的企业是否已包含
   // this.getGroupMemberList(coreInfo.id, coreInfo.type);

  },
  addCompany: function(e){
      let disable = e.currentTarget.dataset.disable;
      let type = e.currentTarget.dataset.type;
      let tips = {
        'company': '该企业已返回，无需再次添加',
        'group': '该企业集合已返回，无需再次添加',
      }
      if (disable) {
        wx.showToast({
          title: tips[type],
          icon: 'none',
          duration: 2000
        })
        return
      }
      let index = e.currentTarget.dataset.index;
      let arr = this.data.companyList;
      let arr2 =[]
      arr[index].checked = !arr[index].checked;

      if (type == 'company'){
        arr[index].companyChecked = arr[index].checked
      }else{
        arr[index].groupChecked = arr[index].checked
      }


      if (arr[index].checked) {
        arr[index]['companyType'] = type
        arr2.push(arr[index])
      }

      for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked) {
          arr2.push(arr[i])
        }
      };
     this.setData({
       companyList: arr,
       selectedList: arr2
     })
  },
  radioChange: function(e){
    let index = e.currentTarget.dataset.index;
    let type = e.detail.value;
    let arr = this.data.companyList;
    let arr2 = []
    arr[index].checked = !arr[index].checked;

    arr[index].companyChecked = type == 'company'
    arr[index].groupChecked = type == 'group'
    
    if (arr[index].checked) {
      arr[index]['companyType'] = type
      arr2.push(arr[index])
    }

    this.setData({
      companyList: arr,
      selectedList: arr2
    })
  },
  bindinput: function (e) {
    var prefix = e.detail.value
    this.setData({
      inputValue: prefix
    })
  },
  bindconfirm: function () {
    if (!this.data.inputValue) {
      return
    }
    this.setData({
      isLoading: true
    })
    this.getSearch();
  },
  getSearch: function(){
    let that = this
    if (!this.data.inputValue){
      that.setData({
        isLoading: false
      })
      return
    }
    if (this.data.serachType == 'Company') {
      Promise.all([
        this.getCompanyList(this.data.inputValue), 
        this.getGroupMemberList(this.data.coreInfo.id, this.data.coreInfo.type)
      ]).then(([companyList, groupMenberList]) => {
        // console.log('dxx', companyList, groupMenberList);
        that.groupMemberListHandler(groupMenberList)
        that.campanyListHandler(companyList)
      })
    } else if (this.data.serachType == 'Person') {
      this.getPersonList(this.data.inputValue);
    }
  },
  bindsearch: function () {
    if (!this.data.inputValue) {
      return
    }
    this.setData({
      isLoading: true
    })
    this.getSearch();
  },
  campanyListHandler(res) {
    let that = this;
    let results = res.data //.data.result && res.data.result.itemListElement
    if (results && results.length) {
      results.forEach(item => {
        item['num'] = 0
        item['checked'] = false
        item['companyChecked'] = false
        if (that.data.recentlyAddedData.includes(item['@id'])) {
          item['disableGroup'] = true
          item['groupChecked'] = true
        } else {
          item['groupChecked'] = false
        }
        if (item['@id'] === that.data.coreInfo.id){
          item['disableCompany'] = true
          item['disableGroup'] = true
          item['companyChecked'] = true
          item['groupChecked'] = true
        }
        item['extType'] = { "6": { "editType": "ADD" } }
        if (that.data.groupCompanyIdList.length
          && that.data.groupCompanyIdList.includes(item['@id'])) {
          item['disableCompany'] = true
          item['companyChecked'] = true
        }

        // 第一次操作已选择该企业，但是没有保存，此时为勾选状态
        let addData = JSON.parse(JSON.stringify(wx.getStorageSync('addCompanyData'))) || []
        if (addData && addData.list && addData.list.length) {
          addData.list.forEach(sItem => {
            if (sItem['@id'] === item['@id']) {
              item['companyChecked'] = sItem.companyType == 'company'
              item['groupChecked'] = sItem.companyType == 'group'
            }
          })
        }
      })
      that.setData({
        isLoading: false,
        companyList: results,
        companyListBackup: JSON.parse(JSON.stringify(results))
      })
    } else {
      that.setData({
        isLoading: false,
        isNoData: true
      })
    }
    // wx.hideLoading();
  },
  getCompanyList: function(name){
    return new Promise((resolve, reject) => {
      if(!name){
        return
      }
      // wx.showLoading({
      //   title: '搜索中...',
      // })
      let payload = {
        "kgidList": [],
        "query": name
      }
      wx.request({
        url: get_api_user + '/entities/search',
        method: 'POST',
        data: payload,
        header: {
          "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
        },
        success: function (res) {
          resolve(res);       
        }
      })
    })
  },
  getPersonList: function (name) {
    let that = this
    wx.request({
      url: get_api_url + '/tkyc/listPerson',
      method: 'POST',
      data: {
        "name": name, // "雷军"
        "equiv": []
      },
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data;
        if (results && results.kgObjectList) {
          results.kgObjectList.forEach(item => {
              item['checked'] = false
              item['extType'] = { "7": { "editType": "ADD" } }
              if (that.data.recentlyAddedData.includes(item['@id'])) {
                item['disableGroup'] = true
                item['checked'] = true
              } 
              // 第一次操作已选择该企业，但是没有保存，此时为勾选状态
              let addData = JSON.parse(JSON.stringify(wx.getStorageSync('addCompanyData'))) || []
              if (addData && addData.list && addData.list.length) {
                addData.list.forEach(sItem => {
                  if (sItem['id'] === item['id']) {
                    item['checked'] = sItem.companyType == 'person'
                  }
                })
              }

          })
          that.setData({
            entityList: results.kgObjectList,
            resultTotal: results.kgResultTotal,
            inputFlag: true,
            isNoData: false,
            isLoading: false
          })
        } else {
          that.setData({
            inputValue: name,
            inputFlag: true,
            isNoData: true,
            isLoading: false
          })
        }
      }
    })
  },
  // 获取企业集合编辑记录
  getGroupEditLogs: function (coreId, coreType) {
    let that = this
    let param = {
      "coreMemberId": coreId,
      "coreMemberType": coreType,
      "page": 0,
      "pageSize": 0,
      "types": [
        that.data.serachType == 'Company' ? 'CompanyGroupCoreCompany' : 'CompanyGroupCorePerson'
       ]
    }
    httpRequest({
      url: get_api_user + '/tkyc/operateLogs',
      method: 'POST',
      data: param
    }).then((res) => {
      let results = res || {}
      console.log('企业集合编辑记录', results)
      if (results.dataList.length){
        let idArr = []
        results.dataList.forEach(item => {
          idArr.push(item.memberId)
        })
        that.setData({
          recentlyAddedData: idArr
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  groupMemberListHandler (res) {
    let that = this;
    let results = res || {}
    let idList = []
    for (let key in results) {
      idList.push(key)
    }
    // idList.push(coreId)
    that.setData({
      groupCompanyIdList: idList
    })
    // this.getSearch();  //判断是什么类型的搜索
    //app.globalData.groupCompanyIdList = arr
  },
  // 获取企业集团下所有的成员id
  getGroupMemberList: function (coreId, type) {
    return new Promise((resolve, reject) => {
      // 通过核心企业id查询成员企业id及状态
      httpRequest({
        url: get_api_user + '/tkyc/matchCompanyGroupMemberEditTypes',
        method: 'POST',
        data: {
          "kgContextLinkList": [
            {
              "@id": "string",
              "@type": [
                "string"
              ],
              "name": "string"
            }
          ],
          "kgExpectTypeList": [
            "string"
          ],
          "memberList": [],
          "termList": [coreId],
          "propertyPath": type + ".id",
          "page": 1,
          "size": 1000000
        }
      }).then((res) => {
        resolve(res);    
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
        reject(errMsg);
      });
    })
  },
  sureSelectScope: function(e){
      let that = this
      let changeArr = that.data.selectedList
      let addData = JSON.parse(JSON.stringify(wx.getStorageSync('addCompanyData'))) || []
      let list =  changeArr || []
      let newData = {
        "list": list,
        "status": true
      }
      wx.setStorageSync('addCompanyData', newData)

      app.globalData.addEditStatus = true
      wx.showToast({
        title: '应用成功',
      })
      wx.navigateBack({
        delta: 2
      })
  },
  // 选择
  select: function (e) {
    var that = this;
    let disable = e.currentTarget.dataset.disable;
    let type = e.currentTarget.dataset.type;
    if (disable) {
      wx.showToast({
        title: '该企业集合已返回，无需再次添加',
        icon: 'none',
        duration: 2000
      })
      return
    }
    let arr2 = [];
    var arr = that.data.entityList;
    var index = e.currentTarget.dataset.index;
    arr[index].checked = !arr[index].checked;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr[i]['companyType'] = type
        arr2.push(arr[i])
      }
    };
    that.setData({
      entityList: arr,
      selectedList: arr2
    })
  },
  backSettingPage: function(){
      getApp().router.navigateTo({
        url: '../characterGroupSetting/characterGroupSetting'
      })
  },
  toHistoryPage: function (e) {
    let type = e.currentTarget.dataset.type
    let ids = []
    getApp().router.navigateTo({
      url: '../groupHistory/groupHistory?type=' + type  //+ '&id=' + ids
    })
  }
})