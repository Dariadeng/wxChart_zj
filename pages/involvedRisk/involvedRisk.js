// pages/involvedRisk/involvedRisk.js --企业涉诉风险分析页--
var wxCharts = require('../../utils/wxcharts.js');
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest, requestNoAuth } from '../../utils/httpUtil.js'
import { numFormat } from '../../utils/util.js'
const app = getApp()

var ringChart = null;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoad: true,
    isLogin: false, // 是否登陆
    isNoData: false,
    isShare: false,
    istrue: false,
    isMonitor: false, //  是否监控
    exceedLimit: false,
    vipExceedLimit: false,
    mainEntityData: {},
    coreId: '', // 核心企业的id
    companyId:'', // 单体企业id
    coreName: '', 
    monitorId: '',
    shareUuid: '',
    isCompany: 0,  // 0 为企业集合 ，1 未单体企业
    legendData: {},
    memberTotal:0,
    groupType: 'Company',  // 1 为公司企业集合 ，2 为人物企业集合
  },
  onLoad: function (options) {
    this.setData({
      coreId: options.coreId && JSON.parse(options.coreId),
      coreName: options.name && JSON.parse(options.name),
      memberTotal: options.total,
      groupType: options.groupType,
      companyId: options.companyId && JSON.parse(options.companyId) || '',
      isCompany: options.isCompany || 0
    })
    if (options.shareUuid){  
      this.setData({
        isShare: true
      })
    }

    if (options.isUser == 1){ // 是否为分享页面进入
      this.getShareData(options.shareUuid)
    } else{
      if (options.isCompany == 1){ // 是否为单体企业
          this.getKycReport(this.data.companyId);
          app.globalData.groupCaseIds = [this.data.coreId]
      }else{
           // 监控列表页面进入且为人物 企业集合
          if (options && this.data.groupType == 'Person' && options.isMonitor == 1){
              if (options.kycReportData != null){
                this.handlePersonRiskData(JSON.parse(options.kycReportData))
              }else{
                this.getGroupKycReportByToken(this.data.coreId, options.groupType)
              }
          }else{
              if (wx.getStorageSync('access_token')) {
                this.getGroupKycReportByToken(this.data.coreId, options.groupType)
              } else {
                this.getGroupKycReport(this.data.coreId, options.groupType);
              }
          } 
          if (wx.getStorageSync('access_token')) {
            this.getGroupMenberListByToken(this.data.coreId); 
          }else {
            if (this.data.groupType == 'Company'){
                app.globalData.groupCaseIds = [this.data.coreId]
             }else{
                this.getGroupMenberList(this.data.coreId);
             }
          }
      } 
      //this.readyChart();
    }
  },
  // 获取数据快照
  getShareData: function(uuid){
      let that = this
      wx.request({
        url: get_api_user + '/sharedDataSnapshots/' + uuid,
        data: {},
        method: 'GET',
        success: function (res) { 
            let results = res.data
            that.setData({
              isLoad: false,
              isShare: true,
              mainEntityData: results.kycReport,
              legendData: results.legendData
            })
            that.readyChart();
        }
      }); 
  },
  // 创建数据快照
  postShareData: function(){  
      let that = this
      httpRequest({
        url: get_api_user + '/sharedDataSnapshots',
        data: {
          kycReport: that.data.mainEntityData,
          legendData: that.data.legendData
        },
        method: 'POST'
      }).then((res) => {
        that.setData({
          shareUuid:res 
        })
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
  },
  // 企业集合的report 
  getGroupKycReport: function (ids, type, timerId = null) {
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "kgResultPageSize": 0,
      "propertyPath": type + ".id",
      "kgExpectTypeList": [
        "CompanyGroup"
      ],
    }
    wx.request({
      url: get_api_user + '/tkyc/matchCompanyGroup',
      data: baseParams,
      method: 'POST',
      success: function (res) {
        let results = res.data
        let kycReport = results.kgGroupEntity && results.kgGroupEntity.kycReport
        if (kycReport == undefined && that.data.requestTaskFlag) {
          clearTimeout(timerId);
          let timerCurrentId = setTimeout(function () {
            that.getGroupKycReport(ids, type, timerCurrentId)
          }, 1000)
        }
        if (kycReport != undefined) {
          that.handlePersonRiskData(kycReport)
        }
      }
    });
  },
  // 企业集合 拓展企业 列表 
  getGroupKycReportByToken: function (ids, type, timerId = null) {
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "kgResultPageSize": 0,
      "propertyPath": type  + ".id",
      "kgExpectTypeList": [
        "CompanyGroup"
      ],
    }
    baseParams = Object.assign(baseParams, that.data.groupMatchParam);
    httpRequest({
      url: get_api_user + '/tkyc/matchCompanyGroup',
      data: baseParams,
      method: 'POST',
    }).then((res) => {
      let results = res
      let kycReport = results.kgGroupEntity && results.kgGroupEntity.kycReport
      if (kycReport == undefined && that.data.requestTaskFlag) {
        clearTimeout(timerId);
        let timerCurrentId = setTimeout(function () {
          that.getGroupKycReportByToken(ids, type, timerCurrentId)
        }, 1000)
      }  
      if (kycReport != undefined) {
        that.handlePersonRiskData(kycReport)
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 企业集合的report 
  getKycReport: function (id) {
    let that = this;
    wx.request({
      url: get_api_url + '/tkyc/listKycReport',
      data: {
        "termList": [id],
        "propertyPath": that.data.isCompany == 1 ? "Company.id" : "CompanyGroupKycReport.id",
        "kgExpectTypeList": [
          that.data.isCompany == 1 ? "CompanyKycReport" : "CompanyGroupKycReport"
        ]
      },
      method: 'POST',
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data && res.data.kgObjectList
        if (results && results.length) {
          let mainComData = results[0].kycReport
          that.handlePersonRiskData(mainComData)
        } else {
          that.setData({
            isLoad: false,
            isNoData: true
          })
        }
      }
    });
  },
  handlePersonRiskData: function (mainComData){
      let that = this;
      mainComData.lawsuitCreditTotal.value = mainComData.lawsuitCreditTotal && numFormat(mainComData.lawsuitCreditTotal.value)
      mainComData.lawsuitCreditForWin.value = mainComData.lawsuitCreditForWin && numFormat(mainComData.lawsuitCreditForWin.value);
      mainComData.lawsuitCreditForLose.value = mainComData.lawsuitCreditForLose && numFormat(mainComData.lawsuitCreditForLose.value);
      that.handleRiskScore(mainComData.riskScoreByLawsuit);
      that.setData({
        isLoad: false,
        mainEntityData: mainComData,
      })
      if (wx.getStorageSync('access_token')) {
        // 登陆获取是否监控
        let id = that.data.isCompany == 1 ? that.data.companyId : that.data.coreId 
        this.searchMonitorStatus(id)
        this.postShareData();
      }
      this.readyChart();
  },
  // 查询该 集团/企业 是否监控
  searchMonitorStatus: function(id){
      let that = this
      httpRequest({
        url: get_api_user + '/accessControls/search',
        data: {
          "privilege": "MONITOR",
          "resourceCategory": "",
          "resourceIds": [id]
        },
        method: 'POST'
      }).then((res) => {
        let results = res
        if (results && results.length) {
          results.forEach(item=>{
            if (item.resourceId === id){
              that.setData({
                monitorId: item.id,
                isMonitor: true
              })
            }
          })
        }
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
  },
  bindAddMonitor: function () {  // 添加监控
      let that = this
      if (wx.getStorageSync('access_token')) {
        httpRequest({
          url: get_api_user + '/accessControls',
          data: {
            "resourceId": that.data.isCompany == 1 ? that.data.companyId : that.data.coreId,
            "privilege": 'MONITOR',
            "resourceCategory": that.data.isCompany==1 ? 'Company' : 'CompanyGroupCoreMember',
            "attributes": {
              "name": that.data.coreName,
              "memberTotal": that.data.memberTotal || 0,
              "groupType": that.data.groupType || 'Company',
              // "kycReportId": that.data.kycReportId
            }
          },
          method: 'POST'
        }).then((res) => {
          let results = res
          let user = wx.getStorageSync('userVipInfo')
          if (res.error == 'Resource Limit Reached' && user &&  user.authority.includes('ROLE_VIP')){
             this.setData({
               //vipExceedLimit: true
             })
            return;
          }
          if (res.error == 'Resource Limit Reached') {
            this.setData({
              //exceedLimit: true
            })
            return;
          }
          if (results.resourceId ) {
            wx.showToast({
              title: '监控成功',
              icon: 'success',
              duration: 3000
            });
            app.globalData.monitorEditStatus = true
            that.setData({
              monitorId: results.id,
              isMonitor: true
            })
          } 
        }).catch((errMsg) => {
          that.setData({
            isMonitor: false
          })
          console.log(errMsg);//错误提示信息
        });
      }else{
        wx.showModal({
          title: '提示',
          content: '登录后才可进行集团编辑，是否登录？',
          success: function (res) {
            console.log(res)
            if (res.confirm) {
              app.router.navigateTo({
                url: '../loginIndex/loginIndex'
              })
            } 
          }
        })
      }
  },
  bindCancleMonitor: function(){  // 取消监控
    let that = this
    wx.showModal({
      title: '提示',
      content: '取消监控将无法接受推送是否确认操作？',
      cancelText: '我再想想',
      confirmText: '确认',
      cancelColor: '#40A9FF',
      success: function (res) {
        console.log(res)
        if (res.confirm) {
          httpRequest({
            url: get_api_user + '/accessControls/' + that.data.monitorId,
            data: {
            },
            method: 'DELETE'
          }).then((res) => {
              wx.showToast({
                title: '已取消监控',
                icon: 'success',
                duration: 3000
              });
              app.globalData.monitorEditStatus = true
              that.setData({
                isMonitor: false
              })
          }).catch((errMsg) => {
            console.log(errMsg);//错误提示信息
          });
        } 
      }
    })
  },
  // 处理风险因子得分
  handleRiskScore: function(data){
    let legendData = {}
    legendData['caseTotals'] = (data * 0.15).toFixed(0);
    legendData['defendantRatio'] = (data * 0.1).toFixed(0);
    legendData['creditForLose'] = (data * 0.4).toFixed(0);
    legendData['averageForLose'] = (data * 0.35).toFixed(0);
    this.setData({
      legendData: legendData
    })
  },
  // 获取企业集团下所有的成员id
  getGroupMenberListByToken: function(coreId){
    let that = this
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
        "termList": [ coreId ],
        "propertyPath": that.data.groupType + ".id",
        "page": 1,
        "size": 100000
      }
    }).then((res) => {
      let results = res || {}
      let arr = []
      for (let key in results) {
        arr.push(key)
      }
      arr.push(coreId)
      app.globalData.groupCaseIds = arr
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  // 获取企业集团下所有的成员id
  getGroupMenberList: function (coreId) {
    let that = this
    // 通过核心企业id查询成员企业id及状态
    requestNoAuth({
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
        "propertyPath": that.data.groupType + ".id",
        "page": 1,
        "size": 100000
      }
    }).then((res) => {
      let results = res || {}
      let arr = []
      for (let key in results) {
        arr.push(key)
      }
      arr.push(coreId)
      app.globalData.groupCaseIds = arr
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  // 跳转会员页面
  toVipPage: function(){
      app.router.navigateTo({
        url: '../vipDescription/vipDescription'
      })
  },
  // 跳转到我的监控页面
  toMintorPage: function(){
      app.router.navigateTo({
        url: '../monitorList/monitorList'
      })
  },
  toCaseListPage(){  // 跳转到集团案件列表页面
    let name = JSON.stringify(this.data.coreName)
    let companyId = JSON.stringify(this.data.companyId)
    app.router.navigateTo({
      url: '../caseList/caseList?name=' + name + '&companyId=' + companyId + '&isCompany=' + this.data.isCompany 
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
  touchHandler: function (e) {
   
  },
  updateData: function () {
    ringChart.updateData({
      title: {
        name: '80%'
      },
      subtitle: {
        color: '#ff0000'
      }
    });
  },
  //右上角分享功能
  onShareAppMessage: function (res) {
    var that = this;
    let isUser = 0
    if (wx.getStorageSync('access_token')){
      isUser = 1
    }
    let name = JSON.stringify(that.data.coreName)
    let companyId = JSON.stringify(that.data.companyId)
    let coreId = JSON.stringify(that.data.coreId)
    return {
      title: '',
      path: '/pages/involvedRisk/involvedRisk?isUser=' + isUser
            + '&shareUuid=' + that.data.shareUuid
            + '&name=' + name + '&isCompany=' + that.data.isCompany
            + '&companyId=' + companyId + '&coreId=' + coreId,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  onShow: function () {
    if (this.data.isLogin) {
      this.setData({
        isLogin: false
      })
      let id = this.data.isCompany == 1 ? this.data.companyId : this.data.coreId
      this.searchMonitorStatus(id)
    }
  },
  onUnload: function () {
    let that = this
    that.setData({
      requestTaskFlag: false // 停止发起集合report请求
    })
  },
  closeRiskDialog: function () {  // 企业集合涉诉风险指数 
    this.setData({
      exceedLimit: false,
      vipExceedLimit: false
    })
  },
  readyChart: function (e) {
    var windowWidth = 320;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }
    let data = this.data.mainEntityData;
    let legendData = this.data.legendData
    ringChart = new wxCharts({
      animation: true,
      canvasId: 'ringCanvas',
      type: 'ring',
      extra: {
        ringWidth: 30,
        pie: {
          offsetAngle: -45
        }
      },
      title: {
        name: data.riskScoreByLawsuit && data.riskScoreByLawsuit.toFixed(0) + '分',
        color: '#1E1E1E',
        fontSize: 25
      },
      subtitle: {
        name: '风险指数',
        color: '#1E1E1E',
        fontSize: 15
      },
      series: [{
        name: '原告占比',
        data: Number(legendData.caseTotals) || 0.1, 
        stroke: false
      }, {
        name: '被告占比',
        data: Number(legendData.defendantRatio) || 0.25, 
        stroke: false
      }, {
        name: '败诉占比',
        data: Number(legendData.creditForLose) || 0.25, 
        stroke: false
      }, {
        name: '败诉赔款总额',
        data: Number(legendData.averageForLose) ||0.4, 
        stroke: false
      }],
      disablePieStroke: true,
      width: 220,
      height: 200,
      dataLabel: false,
      legend: false,
      background: '#f5f5f5',
      padding: 0
    });
    ringChart.addEventListener('renderComplete', () => {
      console.log('renderComplete');
    });
    setTimeout(() => {
      ringChart.stopAnimation();
    }, 500);
  }
})