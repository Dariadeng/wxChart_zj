// pages/characterGroup/characterGroup.js  企业集合页面
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat, HashMap, toDecimalNoZero } from '../../utils/util.js'
const app = getApp()

Page({
  // -1: coreMember - 核心成员 | 1: shareholder-股东管系 | 2: investee-对外投资关系 | 3: identifier-名称相似关系 | 4: location-地址相近关系 | 5: person-人物关联关系
  data: {
    isEditSetting: false,
    groupType: 'Company',  //公司 1， 人物2
    companyCoreId:'',
    progress_txt:'',
    isLoading: true,
    isFirstLoadMember: true,
    coreLoading: false,
    companyLoading: false,
    isShowMemberList: false,  // 是否展示拓展企业
    isLogin: false,
    isMainLoading: true,  // 企业集合kyc 
    isNoData: false,
    isMemberNoData: false,
    requestTaskFlag: true,
    personName:'',
    companyCoreName: '',
    coreCompanyName: '',
    mainData:{},  // 企业集合风险指数
    coreCompanyTotal:0,
    coreCompanyList:[],  // 核心企业集合
    memberTotal:0,
    memberList:[], // 关联企业集合
    allCompanyTotal:0, 
    corePerson:{},
    curPage: 1,    // 拓展企业分页请求
    totalPage: 0,    // 拓展企业总页数
    coreCurPage: 1,    // 核心企业分页请求
    coreTotalPage: 0,    // 核心企业总页数
    groupMatchParam:{},
    currentOrderIndex: 0,
    orderType: [{
      name: '股权',
      value: 'Equity'
    },
      {
        name: '涉诉',
        value: 'Lawsuit'
      }],  // Equity/Lawsuit
    orderFlag: false
  },
  onLoad: function (options) {
      let personName = options && options.personName
      let matchParam =  app.globalData.companyGroupMatchParam
      this.setData({
        personName: personName,
        groupMatchParam: matchParam,
        groupType: options && options.groupType,
        companyCoreId: options && options.companyCoreId,
        companyCoreName: options && options.companyCoreName,
        corePerson: options.corePerson && JSON.parse(options.corePerson)
      })

      let type = options.groupType
      let id = '';
      if (options.groupType == 'Person') {
        wx.setNavigationBarTitle({
          title: personName + '系企业集合'
        })
        // type = 'Person'
        id = this.data.corePerson.id;
        app.globalData.coreGroupInfo = {
           name: this.data.corePerson.name,
           id: this.data.corePerson.id,
           type: "Person"
        }     
      } else if (options.groupType == 'Company') {
        id = this.data.companyCoreId;
        // type = 'Company'
        app.globalData.coreGroupInfo = {
          name: this.data.companyCoreName,
          id: this.data.companyCoreId,
          type : 'Company'
        }
      }
      
      if (wx.getStorageSync('access_token')) {
        this.getCompanyGroupByToken(id, type, true);
        // this.getAllCoreCompanyName(id, type);
      }else{
        this.getCompanyGroup(id, type, true);
      }
  },
  onShow: function () {
    let that = this
    if (this.data.isLogin || app.globalData.groupEditStatus) {
      let coreInfo = app.globalData.coreGroupInfo;
      app.globalData.groupEditStatus = false
      let id = coreInfo.id
      let type = coreInfo.type
      this.setData({
        isLoading: true,
        isLogin: false,
        isMainLoading: true,
        isFirstLoadMember: true,
        progress_txt: '',
        mainData: {},
        coreCompanyList: [],
        memberList: [],
        curPage: 1,   
        totalPage: 0,    
        coreCurPage: 1,    
        coreTotalPage: 0,
      })

      //this.getAllCoreCompanyName(id, type);
      this.getCompanyGroupByToken(id, type, true);
    } 
  },
  getMtachParams: function(){
    let matchParam = app.globalData.companyGroupMatchParam;
    let param = {}
    for (let key in matchParam){
      if (matchParam[key] !=  undefined){
        param[key] = matchParam[key]
      }
    }
    return param;
  },
  // 核心企业 ***** 成员列表 
  getCoreCompanyByToken: function (ids, type) {
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "page": that.data.coreCurPage,
      "size": 10,
      "propertyPath": type + ".id",
      "paramListCompanyRoleSys": 1,
      "kgExpectTypeList": ["CompanyGroup"]
    }
    baseParams = Object.assign(baseParams, that.data.groupMatchParam);
    httpRequest({
      url: get_api_user + '/tkyc/listCompany',
      data: baseParams,
      method: 'POST',
    }).then((res) => {
      let results = res
      if (results != undefined) {
        if (results.kgObjectList && results.kgObjectList.length) {
          that.handleGroupData(results.kgObjectList, true)
        }
        let cTotalPage = Math.ceil(results.kgResultTotal / 10)

        that.setData({
          coreTotalPage: cTotalPage,
          isLoading: false,
          coreLoading: false,
          isNoData: false
        })
      } else {
        that.setData({
          isLoading: false,
          coreLoading: false,
          isNoData: true
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  getCoreCompany: function (ids, type){
    let that = this
    let baseParams = {
      "termList": [
        ids
      ],
      "page": that.data.coreCurPage,
      "size": 10,
      "propertyPath": type + ".id",
      "paramListCompanyRoleSys": 1,
      "kgExpectTypeList": ["CompanyGroup"]
    }
    baseParams = Object.assign(baseParams, that.data.groupMatchParam);
    wx.request({
      url: get_api_user + '/tkyc/listCompany',
      data: baseParams,
      method: 'POST',
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data
        if (results != undefined) {
          if (results.kgObjectList && results.kgObjectList.length) {
            that.handleGroupData(results.kgObjectList, true)
          }
          let cTotalPage = Math.ceil(results.kgResultTotal / 10)

          that.setData({
            coreTotalPage: cTotalPage,
            isLoading: false,
            coreLoading: false,
            isNoData: false
          })
        } else {
          that.setData({
            isLoading: false,
            coreLoading: false,
            isNoData: true
          })
        }
      }
    }) 
  },
  // 企业集合 
  getCompanyGroupByToken: function(ids, type, flag){
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "kgResultPageNumber": that.data.curPage,
      "kgResultPageSize": 10,
      "propertyPath": type + ".id",
      "kgExpectTypeList": [
        "CompanyGroup"
      ],
      "orderBy": that.data.orderType[that.data.currentOrderIndex].value
    }
    baseParams = Object.assign(baseParams, that.data.groupMatchParam);
    httpRequest({
      url: get_api_user + '/tkyc/matchCompanyGroup',
      data: baseParams,
      method: 'POST',
    }).then((res) => {
        wx.hideLoading();
        let results =  res 
        if (results != undefined) {
            let kycReport = results.kgGroupEntity && results.kgGroupEntity.kycReport
            let name = '' 
            if (results.kgGroupEntity && results.kgGroupEntity.remark && results.kgGroupEntity.remark.name) {
                name = results.kgGroupEntity.remark.name
            } else if (results.kgGroupEntity){
                name = results.kgGroupEntity.name
            }
           if (that.data.groupType == 'Company' && name){
              that.setData({
                companyCoreName : name
              })
            }else{
              wx.setNavigationBarTitle({
                title: name + '系企业集合'
              })
              that.setData({
                personName: name
              })
              app.globalData.coreGroupInfo.name = name
            }

            // 只请求一次企业集合报告
            if (flag && kycReport == undefined){
              that.getGroupReportByToken(ids, type)
            }else{
              that.handleGroupReport(kycReport)
            }

            //that.getCoreCompanyByToken(ids, type)
            if (results.kgMemberList && results.kgMemberList.length) {
                that.handleGroupData(results.kgMemberList, true)
            }
            let totalPage = Math.ceil(results.kgResultTotal / 10)

            let cTotal = 0, mTotal = 0, cTotalPage = 0
            if (results.kgGroupEntity) {
              cTotal = results.kgGroupEntity.coreMemberTotal;
              mTotal = results.kgGroupEntity.extMemberTotal
              cTotalPage = Math.ceil(cTotal / 10)
            }

            that.setData({
              coreCompanyTotal: cTotal,
              memberTotal: mTotal,
              allCompanyTotal: mTotal + cTotal,
              coreTotalPage: cTotalPage ,
              totalPage: totalPage,
              isLoading: false,
              coreLoading: false,
              isNoData: false   
            }) 
        } else {
          that.setData({
            isLoading: false,
            coreLoading: false,
            isNoData: true
          })
        }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    }) 
  },

  // 企业集合 
  getCompanyGroup: function (ids, type, flag){
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "kgResultPageNumber": that.data.curPage,
      "kgResultPageSize": 10,
      "propertyPath": type + ".id",
      "kgExpectTypeList": [
        "CompanyGroup"
      ],
      "orderBy": that.data.orderType[that.data.currentOrderIndex].value
    }
    baseParams = Object.assign(baseParams, that.data.groupMatchParam);
    wx.request({
      url: get_api_user + '/tkyc/matchCompanyGroup',
      data: baseParams,
      method: 'POST',
      success: function (res) {
          wx.hideLoading();
          let results = res.data
          if (results != undefined){
            let kycReport = results.kgGroupEntity && results.kgGroupEntity.kycReport
            // 只请求一次企业集合报告
            if (flag && kycReport == undefined) {
              that.getGroupReport(ids, type)
            } else {
              that.handleGroupReport(kycReport)
            }

            if (results.kgMemberList && results.kgMemberList.length) {
              that.handleGroupData(results.kgMemberList, true)
            }
            let totalPage = Math.ceil(results.kgResultTotal / 10)

            let cTotal = 0, mTotal = 0, cTotalPage = 0
            if (results.kgGroupEntity) {
              cTotal = results.kgGroupEntity.coreMemberTotal;
              mTotal = results.kgGroupEntity.extMemberTotal;
              cTotalPage = Math.ceil(cTotal / 10)
            }
            // that.getCoreCompany(ids, type)
            that.setData({
              isMemberNoData: true,   // 未登陆无拓展企业数据
              coreCompanyTotal: cTotal,
              memberTotal: mTotal,
              allCompanyTotal: mTotal + cTotal,
              coreTotalPage: cTotalPage ,
              totalPage: totalPage,
              isLoading: false,
              coreLoading: false,
              isNoData: false   
            })  
          } else {
            that.setData({
              isLoading: false,
              coreLoading: false,
              isNoData: true
            })
          }
      }
    });
  },

  // 企业集合 拓展企业 列表 
  getMemberCompanyByToken: function (ids, type, flag) {
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "propertyPath": type + ".id",
      // "kgExpectTypeList": [
      //   "CompanyGroup"
      // ],
      "kgResultPageNumber": that.data.curPage,
      "kgResultPageSize": 10,

    }
    httpRequest({
      url: get_api_user + '/tkyc/matchCompanyGroupMember',
      data: baseParams,
      method: 'POST',
    }).then((res) => {
      let results = res
      if (results != undefined && results.kgResultTotal){
          let totalPage = Math.ceil(results.kgResultTotal / 10)
          let mTotal = results.kgResultTotal
          if (results.kgMemberList && results.kgMemberList.length) {
              that.handleGroupData(results.kgMemberList)
          }
          that.setData({
            isMemberNoData: false,
            memberTotal: mTotal,
            totalPage: totalPage || 0
          })
      }
      let memberData = that.data.memberList;
      if (!memberData.length) {
        that.setData({
          isMemberNoData: true
        })
      } 
      that.setData({
        companyLoading: false
      })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 企业集合的report 
  getGroupReport: function (ids, type, timerId = null){
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
          that.getGroupReport(ids, type)
          }, 1000)
        }
        if (kycReport != undefined) {
          that.handleGroupReport(kycReport)
        }
      }
    });
  },
  handleGroupReport: function (kycReport){
    let mianEntity = kycReport;
    let that = this;
    mianEntity.lawsuitCreditTotal.value = mianEntity.lawsuitCreditTotal && numFormat(mianEntity.lawsuitCreditTotal.value)
    that.setData({
      isMainLoading: false,
      progress_txt: mianEntity && mianEntity.riskScoreByLawsuit.toFixed(0) || 0,
      mainData: mianEntity,
    })
    //绘制背景
    that.drawProgressbg();
    //开始progress
    that.startProgress();
  },
  // 企业集合 拓展企业 列表 
  getGroupReportByToken: function (ids, type, timerId = null) {
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
          that.getGroupReportByToken(ids, type, timerCurrentId)
        }, 1000)
      } 
      if (kycReport != undefined) {
        that.handleGroupReport(kycReport)
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 处理 人物 企业集合数据
  handleGroupData: function (results, flag){
      // console.log('人物企业集合', results)
      let that = this
      let coreData = that.data.coreCompanyList;
      let memberData = that.data.memberList;
      results.forEach(item => {
        let reportDetail = item.kycReport
        if (reportDetail) {
          if (!reportDetail.lawsuitCountTotal || !reportDetail.lawsuitCountForLose) {
            reportDetail['loseRatio'] = 0 + "%"
            reportDetail['defendantRatio'] = 0 + "%"
          } else {
            reportDetail['loseRatio'] = (reportDetail.lawsuitCountForLose / reportDetail.lawsuitCountTotal * 100).toFixed(2) + '%'
            reportDetail['defendantRatio'] = (reportDetail.lawsuitCountAsDefendant / reportDetail.lawsuitCountTotal * 100).toFixed(2) + '%'
          }
          if (reportDetail.lawsuitCreditTotal) {
            reportDetail['lawsuitCreditTotalValue'] = numFormat(reportDetail.lawsuitCreditTotal.value);
          }
          if (reportDetail.lawsuitCreditForLose) {
            reportDetail['lawsuitCreditForLoseValue'] = numFormat(reportDetail.lawsuitCreditForLose.value);
          }
          reportDetail.riskScoreByLawsuit = reportDetail.riskScoreByLawsuit.toFixed(0)
        }
        item.kycReport = reportDetail || {}

        //区分核心公司/关联公司
        if (item.extType && item.extType['-1']) {
          if (item.extType['-1'].editType === 'SYS'){
            item['isCoreCompany'] = true
          }
          coreData.push(item)
        } else {
          memberData.push(item)
        }
        // 处理实控比例
        if (item.extType[1] && item.extType[1].equityRatio != undefined) {
          item.extType[1]['showEquityRatio'] = toDecimalNoZero(item.extType[1].equityRatio * 100)
        }
        if (item.extType[2] && item.extType[2].equityRatio != undefined) {
          item.extType[2]['showEquityRatio'] = toDecimalNoZero(item.extType[2].equityRatio * 100)
        }
        
        // 判断是否多条关系都是删除状态，如果是则置灰
        item['isDelete']  = Object.values(item.extType).every(extItem => { return extItem.editType == 'DEL' })

        // 是否为自定义标签
        for (let key in item.extType) {
          item['isCustomize'] = item.extType[key].editType == 'ADD'
        }

      })

      if(flag){
        app.globalData.coreGroupCompany = coreData
      }
      if (that.data.memberList.length){
        that.setData({
          isShowMemberList: true
        })
      }
      that.setData({
        coreLoading: false,
        companyLoading: false,
        coreCompanyList: coreData,
        memberList: memberData
      })
  },

  // 获取所有核心企业成员的名称
  getAllCoreCompanyName: function (id, type) {
    let that = this;
    app.globalData.coreGroupCompanyName = []
    let baseParams = {
      "termList": [
        id
      ],
      "page": 1,
      "size": -1,
      "propertyPath": type + ".id",
      "paramListCompanyRoleSys": 1,
      "kgExpectTypeList": ["CompanyGroup"]
    }
    baseParams = Object.assign(baseParams, that.data.groupMatchParam);
    httpRequest({
      url: get_api_user + '/tkyc/listCompany',
      data: baseParams,
      method: 'POST',
    }).then((res) => {
      let results = res
      if (results != undefined) {
        if (results.kgObjectList && results.kgObjectList.length) {
          let coreCompanyName = [];
          results.kgObjectList.forEach(item => {
            coreCompanyName.push(item.name)
          })
          app.globalData.coreGroupCompanyName = coreCompanyName
        }
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },

  // 单个企业跳转涉诉风险指数页
  toRiskPage: function(e){ 
    let that = this; 
    let name = e.currentTarget.dataset.name;  // 企业名称
    let id = e.currentTarget.id;
    // 如果案件数量为0则跳转到工商信息页
    if (e.currentTarget.dataset.lawsuit) {
      let coreId = ''
      if (that.data.groupType == 'Company') {
        coreId = JSON.stringify(that.data.companyCoreId)
      } else {
        coreId = JSON.stringify(that.data.corePerson.id);
      }
      let companyId = JSON.stringify(e.currentTarget.id)
      name = name && JSON.stringify(name)
      // isCompany 判断是否为单体企业跳转
      app.router.navigateTo({
        url: '../involvedRisk/involvedRisk?coreId=' + coreId + '&companyId=' + companyId + '&name=' + name + '&isCompany=1'
      })
    } else {
      if(id.length == 36){  // 点击人物
        return;
      }
      let kgId = e.currentTarget.id
      app.router.navigateTo({
        url: '../detail/detail?name=' + name + '&kgId=' + kgId
      })
    }
  },
  // 企业集合跳转到涉诉风险指数页面
  sureListScope: function () { 
      var that = this;
      let name = "", coreId =""
      if(that.data.groupType == 'Company' ){
        name = JSON.stringify(that.data.companyCoreName)
        coreId = JSON.stringify(that.data.companyCoreId)
      }else{
        name = JSON.stringify(that.data.personName)
        coreId = JSON.stringify(that.data.corePerson.id)
      }
      app.router.navigateTo({
        url: '../involvedRisk/involvedRisk?coreId=' + coreId + '&name=' + name 
          + '&isCompany=0&groupType=' + that.data.groupType + '&total=' 
          + that.data.allCompanyTotal
      })
  },
  // 跳转到拓展范围页面
  toSettingPage: function(e){
    if (wx.getStorageSync('access_token')) {
      this.setData({
        isEditSetting: true
      })
      wx.removeStorageSync('selfGroupData')
      wx.removeStorageSync('addCompanyData')
      app.globalData.expendRelationNoSelect = {}
      app.globalData.expendRelationSelectAll = []
      app.globalData.setRangeCancelSelect = new HashMap();
      getApp().router.navigateTo({
        url: '../characterGroupSetting/characterGroupSetting' 
      })
    } else {
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
  setControllData: function(type,list){
      let that = this
      if (type == 'member') {
        that.setData({
          memberList: list
        })
      } else {
        that.setData({
          coreCompanyList: list
        })
      }
  },
  // 获取实际控制人信息
  getControlledData: function(e){
      let that = this;
      let companyName = e.currentTarget.dataset.name;
      let index = e.currentTarget.dataset.index;
      let type = e.currentTarget.dataset.type;
      let list = type == 'member' ? that.data.memberList : that.data.coreCompanyList
      // 展开收缩
      if (list[index].showController){
        list[index].showController = false
        that.setControllData(type,list)
        return;
      }
      // 避免重复请求 实际控制的数据则
      if (list[index]['controllerData'] != undefined) {
        list[index].showController = true
        that.setControllData(type,list)
        return;
      }
      wx.request({
        url: get_api_url + '/tkyc/matchActualController',
        data: {
          'nameCompany': companyName
        },
        method: 'POST',
        header: {
          "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
        },
        success: function (res) {
          let results = res.data
          if (results && results.kgResult != undefined){
            results.kgResult['controllerRatio'] = toDecimalNoZero(results.kgResult.actualControllerRatio * 100)
            list[index]['controllerData'] = results.kgResult  
          }else{
            list[index]['noControllerData'] = true
          }
          list[index]['showController'] = true
          that.setControllData(type, list)
        }
      });
  },
  // 跳转实控路径页面
  toControlledPage: function (e) {
    let dataset = e.currentTarget.dataset;
    let totalStock = e.currentTarget.dataset.ratio
    let end = {
      name: dataset.endname,
      id: dataset.endid
    }
    let begin = {
      name: dataset.beginname,
      id: dataset.beginid
    }

    getApp().router.navigateTo({
      url: '../controlledPath/controlledPath?type=actualController&totalStock=' + totalStock
           + '&begin=' + JSON.stringify(begin) + '&end=' + JSON.stringify(end)
    })
  },
  // 下拉加载分页
  onReachBottom: function () {
    let type = this.data.groupType 
    let id = this.data.groupType == 'Company' ? this.data.companyCoreId : this.data.corePerson.id 
    let curPage = this.data.curPage;
    let totalPage = this.data.totalPage;
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
      isloading: false,
      curPage: curPage
    })
    if (this.data.isShowMemberList) {
      this.setData({
        companyLoading: true
      })
    }else{
      this.setData({
        coreLoading: true
      })
    }
    if (wx.getStorageSync('access_token')) {
      this.getCompanyGroupByToken(id, type)
    } else {
      this.getCompanyGroup(id, type)
    }
  },
  closeMask: function (e) {
    this.setData({
      orderFlag: false
    })
  },
  showOrder: function(){
    this.setData({
      orderFlag: !this.data.orderFlag
    })
  },
  // 排序
  orderGroup: function (e) {
    let index = e.currentTarget.dataset.index
    if (this.data.currentOrderIndex == index) {
      return
    }
    let type = this.data.groupType
    let id = this.data.groupType == 'Company' ? this.data.companyCoreId : this.data.corePerson.id 
    this.setData({
      orderFlag: false,
      coreCompanyList: [],
      currentOrderIndex: index,
      memberList: [],
      curPage: 1,
      totalPage: 0,
      coreCurPage: 1,
      coreTotalPage: 0,
    })
    wx.showLoading({
      title: '正在加载中...',
    })
    if (wx.getStorageSync('access_token')) {
      this.getCompanyGroupByToken(id, type)
    } else {
      this.getCompanyGroup(id, type)
    }
  },
  /**
* 画progress底部背景
*/
  drawProgressbg: function () {
    // 使用 wx.createContext 获取绘图上下文 context
    var ctx = wx.createCanvasContext('canvasProgressbg');
    setTimeout(function () {
      const query = wx.createSelectorQuery() 
      query.selectAll('.progress_bg_wrap').boundingClientRect();
      query.exec(function (rect) {
        let newRect = rect && rect[0] && rect[0][0]
        let width = newRect.width / 2;
        let height = newRect.height / 2;
        let size = newRect.width / 2 - 10;
        // 设置圆环的宽度
        ctx.setLineWidth(3);
        // 设置圆环的颜色
        ctx.setStrokeStyle('#f2b2b3');
        // 设置圆环端点的形状
        ctx.setLineCap('round')
        //开始一个新的路径
        ctx.beginPath();
        //设置一个原点(110,110)，半径为100的圆的路径到当前路径
        // ctx.arc(60, 60, 50, 0, 2 * Math.PI, false);
        ctx.arc(width, height, size, 0, 2 * Math.PI, false);
        //对当前路径进行描边
        ctx.stroke();
        //开始绘制
        ctx.draw();
      });
    })  
  },

  /**
     * 画progress进度
     */
  drawCircle: function (step) {
    // 使用 wx.createContext 获取绘图上下文 context
    var context = wx.createCanvasContext('canvasProgress');
    setTimeout(function () {
      const query = wx.createSelectorQuery()
      query.selectAll('.progress_bg_wrap').boundingClientRect();
      query.exec(function (rect) {
        let newRect = rect && rect[0] && rect[0][0]
        let width = newRect.width / 2;
        let height = newRect.height / 2;
        let size = newRect.width / 2 - 10;
        // 设置圆环的宽度
        context.setLineWidth(3);
        // 设置圆环的颜色
        context.setStrokeStyle('#FFFFFF');
        // 设置圆环端点的形状
        context.setLineCap('round')
        //开始一个新的路径
        context.beginPath();
        //参数step 为绘制的圆环周长，从0到2为一周 。 -Math.PI / 2 将起始角设在12点钟位置 ，结束角 通过改变 step 的值确定
        context.arc(width, height, size, -Math.PI / 2, step * Math.PI - Math.PI / 2, false);
        //对当前路径进行描边
        context.stroke();
        //开始绘制
        context.draw()
      });
    })  
  },
  /**
    * 开始progress
    */
  startProgress: function () {
    this.setData({
      count: 0
    });
    let maxNum = this.data.progress_txt / 100 * 6;
    // 设置倒计时 定时器 每100毫秒执行一次，计数器count+1 ,耗时6秒绘一圈
    this.countTimer = setInterval(() => {
      if (this.data.count <= maxNum) {
        this.drawCircle(this.data.count / (6 / 2))
        this.data.count++;
      }
    }, 100)
  },

  onUnload: function () {
    let that = this
    that.setData({
      requestTaskFlag: false // 停止发起集合report请求
    })
  }
  
})