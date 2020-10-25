// pages/monitorList/monitorList.js --我的监控列表页面--
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat, HashMap } from '../../utils/util.js'
const app = getApp()

Page({
  data: {
    companyList: [],
    groupList:[],
    isLoad: true,
    isNoData: false,
    companyIdArr:[],
    currentTabIndex: 0,
    index: 0,
    Mstart: 0
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getMonitorList()
  },
  onShow: function(){
    if (app.globalData.monitorEditStatus){
      this.getMonitorList()
    }
  },
  onTabsItemTap: function (event) {
    let index = event.currentTarget.dataset.index;
    this.setData({
      currentTabIndex: index
    })
  },
  // 获取监控列表公司的id 
  getMonitorList: function () {
    let that = this
    httpRequest({
      url: get_api_user + '/accessControls/search',
      data: {
        "privilege": "MONITOR",
        "resourceCategory": "",
        "resourceIds": []
      },
      method: 'POST'
    }).then((res) => {
      let results = res
      if (results && results.length) {
        let groupData = [], companyIdList = []
        results.forEach(item => {
          if (item.resourceCategory === 'Company') {
               companyIdList.push(item.resourceId)
          } else {
            item['x'] = 0;
            if (item.attributes != null) {
              item['groupType'] = item.attributes.groupType
              item['kycReportId'] = item.attributes.kycReportId
              if (item.attributes.memberTotal 
                && item.attributes.groupType == 1 
                || item.attributes.groupType == 'Company') {
                item['name'] = item.attributes.name + '等' + item.attributes.memberTotal + '家企业'
              }
              if (item.attributes.name 
              && item.attributes.groupType == 2
              || item.attributes.groupType == 'Person') {
                item['name'] = item.attributes.name + '系企业集合'
              }
              if (item.attributes.patchDetails != null){
                item['remarkName'] = item.attributes.patchDetails.remark &&item.attributes.patchDetails.remark.name
              }
            }
            groupData.push(item) 
          } 
        })
        that.setData({
          isLoad: false,
          //companyList: companyData,
          groupList: groupData
        })
        // 查询工商信息
        that.getMonitorInfo(companyIdList)
      } else {
        that.setData({
          historyData: []
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  // 获取监控列表公司的工商信息
  getMonitorInfo: function (idList){
    let that = this
    // let ids = []
    // let idMap = new HashMap();
    // idList.forEach(item => {
    //     ids.push(item.resourceId)
    //     idMap.put(item.resourceId, item)
    // })
    if (idList == undefined || !idList.length){
      return
    }
    that.setData({
      companyIdArr: idList
    })
    httpRequest({
      url: get_api_user + '/entities/search',
      method: 'POST',
      data: {
        "kgidList": idList,
        "query": ""
      },
     }).then((res) => {
        let results = res //data.result && res.data.result.itemListElement
        let companyData = [] 
        if (results && results.length) {
          results.forEach(item => {
            item.saicRegistrationStatus = item.saicRegistrationStatus.replace(/\（.*?\）/g, '')
            if (item.saicRegistrationCapital.value) {
              item.saicRegistrationCapital.value = numFormat(item.saicRegistrationCapital.value)
            } else {
              item.saicRegistrationCapital.value = '未公开'
            }               
            item['x'] = 0;
            companyData.push(item)
             
          })
          that.setData({
            companyList: companyData
          })
        }
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
  },
  // 跳转到企业集团页面
  toGroupPage: function(e){
    let that = this;
    let isCompany = that.data.currentTabIndex // Number(e.currentTarget.dataset.company)
    let groupData = that.data.groupList;
    let index =  e.currentTarget.dataset.index
    let name =  JSON.stringify(e.currentTarget.dataset.name)
    let coreId = JSON.stringify(e.currentTarget.id)
    let groupType = ''
    let personParams = ''
    if (that.data.currentTabIndex == 0){
      groupType = groupData[index].groupType
      if (groupType == 1){
        groupType = 'Company'
      }
      if (groupType == 2) {
        groupType = 'Person'
      }
      if (groupData[index].attributes.kycReport){
        let kycReportData = JSON.stringify(groupData[index].attributes.kycReport)
        personParams = '&kycReportData=' + kycReportData
      }
    }
    wx.navigateTo({
      url: '../involvedRisk/involvedRisk?coreId=' + coreId + '&companyId=' + coreId 
           + '&name=' + name + '&isCompany=' + isCompany + '&isMonitor=1&groupType=' 
           + groupType + personParams
    })
  },
  toNotePage: function(e){
      let id = e.currentTarget.dataset.id;
      let name = e.currentTarget.dataset.name;
      wx.navigateTo({
        url: '../editNote/editNote?id=' + id + '&name=' + name 
      })
  },
  touchstart: function (e) {
    this.setData({
      index: e.currentTarget.dataset.index,
      Mstart: e.changedTouches[0].pageX
    });
  },
  touchmove: function (e) {
    var history = this.data.groupList;
    var move = this.data.Mstart - e.changedTouches[0].pageX;
    history[this.data.index].x = move > 0 ? -move : 0;
    this.setData({
      groupList: history
    });
  },
  touchend: function (e) {
    var history = this.data.groupList;
    var move = this.data.Mstart - e.changedTouches[0].pageX;
    history[this.data.index].x = move > 100 ? -180 : 0;
    this.setData({
      groupList: history
    });
  },
})