// pages/groupHistory/groupHistory.js --添加企业历的史记录--
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
const app = getApp()

Page({
  data: {
    coreId:'',
    groupHistoryData: [],
    companyHistoryData: [],
    select_all: false,
    companySelectArr: [],
    groupSelectArr: [],
    showTab: false,
    currentTabIndex: 0,
    historyType: 'company',
    expandTypeList: {
      '-1': 'coreMember',  // 核心成员 
      1: 'shareholder', // 股东关系 
      2: 'investee',    // 对外投资关系 
      3: 'identifier',  // 名称相似关系  
      4: 'location',    // 地址相近关系 
      5: 'person',       // 人物关联关系
      6: 'companyGroupMember', // 新增企业
    },
  },
  onLoad: function (options) {
    if(options.type){
        this.setData({
          historyType: options.type
        })
        if (options.type == 'Company'){
          this.setData({
            showTab: true
          })
        }
        let coreInfo = app.globalData.coreGroupInfo;
        this.getRecentHistory(coreInfo.id, coreInfo.type);
    }else{
        this.setData({
          coreId: options && options.coreId
        })
        this.getRecordData();
    }
  },

  // 获取最近添加的人物, 或者 单体企业和企业集合（历史记录）
  getRecentHistory: function (coreId, type) {
      let that = this
      let param = {
        "coreMemberId": coreId,
        "coreMemberType": type,
        "page": 0,
        "pageSize": 0,
        "types": that.data.historyType == 'Person' ? [ 'CompanyGroupCorePerson'] :[
          "Company", 'CompanyGroupCoreCompany'
        ]
      }
      // 通过核心企业id查询成员企业id及状态
      httpRequest({
        url: get_api_user + '/tkyc/operateLogs',
        method: 'POST',
        data: param
      }).then((res) => {
        // console.log('人物企业集合', results)
        let results = res.dataList 
        let groupData = [], companyData = []
        if (results && results.length) {
          results.forEach(item => {
            item['checked'] = false;
            item['createDate'] = item.createAt && item.createAt.trim().split(" ")[0]
            if (item.memberType == 'CompanyGroupCorePerson') {
              item['extType'] = { "7": { "editType": "ADD" } }
            }else{
              item['extType'] = { "6": { "editType": "ADD" } }
            }
            if (item.memberType == 'Company'){
              companyData.push(item)
            }else{
              groupData.push(item)
            }
          })
          that.setData({
            groupHistoryData: groupData,
            companyHistoryData: companyData
          })
        } else {
          that.setData({
            groupHistoryData: [],
            companyHistoryData: []
          })
        }
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
  },
  // 企业 -企业集合 获取最近添加的单体企业（历史记录）
  getRecordData: function () {
    let that = this
    httpRequest({
      url: get_api_user + '/companyGroupMemberPatches/search',
      data: {
        "actions": ["ADD"],
        "companyIds": [],
        "coreCompanyId": that.data.coreId
      },
      method: 'POST'
    }).then((res) => {
      let results = res
      if (results && results.length) {
        results.forEach(item=>{
          item['checked'] = false;
          item['createDate'] = item.createAt && item.createAt.trim().split(" ")[0]
        })
        that.setData({
          groupHistoryData: results
        })
      } else {
        that.setData({
          groupHistoryData: []
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  onTabsItemTap: function (event) {
    let index = event.currentTarget.dataset.index;
    this.setData({
      currentTabIndex: index
    })
  },
  // 选择
  select: function (e) {
    var that = this;
    let arr2 = [];
    let flag = that.data.currentTabIndex == 0
    var arr = flag ? that.data.groupHistoryData : that.data.companyHistoryData;
    var index = e.currentTarget.dataset.id;
    arr[index].checked = !arr[index].checked;

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr2.push(arr[i])
      }
    };
    if (flag){
      that.setData({
        groupHistoryData: arr,
        groupSelectArr: arr2
      })
    }else{
      that.setData({
        companyHistoryData: arr,
        companySelectArr: arr2
      })
    }
  },
  // 全选
  select_all: function () {
    let that = this;
    that.setData({
      select_all: !that.data.select_all
    })
    if (that.data.select_all) {
      let flag = that.data.currentTabIndex == 0
      var arr = flag ? that.data.groupHistoryData : that.data.companyHistoryData;
      let arr2 = [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked == true) {
          arr2.push(arr[i]);
        } else {
          arr[i].checked = true;
          arr2.push(arr[i]);
        }
      }
      if (flag) {
        that.setData({
          groupHistoryData: arr2,
          groupSelectArr: arr2
        })
      }else{
        that.setData({
          companyHistoryData: arr2,
          companySelectArr: arr2
        })
      }
    }
  },
  // 取消全选
  select_none: function () {
    let that = this;
    that.setData({
      select_all: !that.data.select_all
    })
    let flag = that.data.currentTabIndex == 0
    var arr = flag ? that.data.groupHistoryData : that.data.companyHistoryData;
    let arr2 = [];
    for (let i = 0; i < arr.length; i++) {
      arr[i].checked = false;
      arr2.push(arr[i]);
    }
    if (flag) {
      that.setData({
        groupHistoryData: arr2,
        groupSelectArr: []
      })
    }else{
      that.setData({
        companyHistoryData: arr2,
        companySelectArr: []
      })
    }
  },
  // 单个或者批量删除添加的公司
  bindDeleteGroupMember: function(){
    let that = this
    let groupSelectArr = that.data.groupSelectArr
    let companySelectArr = that.data.companySelectArr
    if (!(companySelectArr.length || groupSelectArr.length)){
        wx.showToast({
          title: '请选择后操作',
          icon: 'none',
          duration: 2000
        })
       return 
    } 
    let params = []
    companySelectArr.forEach(item => {
        params.push({
          'type': 'singleMemberEdit',
          'checked': false,
          'memberId': item.memberId,
          'memberName': item.memberName,
          'extType': item.extType
        })
    })
    groupSelectArr.forEach(item => {
      params.push({
        'type': 'groupMemberEdit',
        'checked': false,
        'coreMemberId': item.memberId,
        'coreMemberType': item.extType[7] != undefined ? 'Person' : 'Company' 
      })
    })    
    let coreInfo = app.globalData.coreGroupInfo;
    httpRequest({
      url: get_api_user + '/tkyc/companyGroupEdit', //'/patches/batchSave',
      data: {
        "coreMemberId": coreInfo.id,
        "coreMemberType": coreInfo.type,
        "patches": params
      },
      method: 'POST',
    }).then((res) => {
      this.getRecentHistory(coreInfo.id, that.data.historyType)
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 3000
      });
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    }) 
    // httpRequest({
    //   url: get_api_user + '/companyGroupMemberPatches/batchDelete',
    //   data: {
    //     "ids": idArr
    //   },
    //   method: 'POST'
    // }).then((res) => {
    //   that.getRecordData()    
    //   wx.showToast({
    //     title: '删除成功',
    //     icon: 'success',
    //     duration: 3000
    //   });    
    // }).catch((errMsg) => {
    //   console.log(errMsg);//错误提示信息
    // }); 
  },
  
    // // 公司 -企业集合 获取最近添加的单体企业和企业集合（历史记录）
  // getCompanyHistory: function (ids){
  //   let that = this
  //   httpRequest({
  //     url: get_api_user + '/patches/links',
  //     data: {
  //       "linkInIds": [ids],
  //       "linkType": 'companyGroupMember',
  //       "page": 1,
  //       "size": 100
  //     },
  //     method: 'POST'
  //   }).then((res) => {
  //     console.log('公司历史记录', res)
  //     let results = res.dataList
  //     if (results && results.length) {
  //       results.forEach(item => {
  //         item['checked'] = false;
  //         item['createDate'] = item.createAt && item.createAt.trim().split(" ")[0]
  //         item['attributes'] = { "name": '' };
  //         item['attributes']['name'] = item.name
  //       })
  //       that.setData({
  //         groupHistoryData: results
  //       })
  //     } else {
  //       that.setData({
  //         groupHistoryData: []
  //       })
  //     }
  //   }).catch((errMsg) => {
  //     console.log(errMsg);//错误提示信息
  //   });
  // },
})