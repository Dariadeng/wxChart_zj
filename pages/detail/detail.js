// pages/detail/detail.js
import { get_api_url, get_api_user, get_api_kg } from '../../utils/config.js'
import { numFormat, HashMap, toDecimalNoZero, utcBeijing } from '../../utils/util.js'
import { httpRequest } from '../../utils/httpUtil.js'
const reg = /^[\u4E00-\u9FA5]{4,20}$/;
const app = getApp()

Page({
  data: {
    apiKey: 'idhOgepvtp6k5B02MJ0F23eZzEL3Q8OT6yo6iaiw',
    moreLoading: false,
    isLoad:true,
    isNoData:false,
    isLogin: false,
    loadStep: 1,
    isUpdating: false,
    isRefresh: true,
    finalRefreshDate: '',
    expireAfter: 3600,
    lawsuitInfoLoad: true,
    basicInfo: {}, //基本信息
    lawsuitInfo: {}, // 单体企业维度涉案
    shareholderInfo: {}, // 股东信息
    investmenInfo: {}, // 对外投资
    managerInfo: [], // 主要人员
    equityPledgeInfo:[],
    companyPersonList:[],
    coreId:'',
    companyId:'',
    kgId: "",
    entityName: '',
    coreCompanyName:'',
    companyStatus: 0,  // 0 为未添加到该集合， 1为自定义添加 ，2 为系统添加
    showInvestment: false,
    showManager: false,
    showPledge: false,
    showLawsuit: false
  },
  onLoad: function (options) {
    this.setData({
      entityName: options && options.name,
      kgId: options && options.kgId,
    })
    // 获取董监高后 获取公司信息
    this.getCompanyPersonData(options.name)
  },
  onShow: function () {
    if (this.data.isLogin) {
      this.setData({
        isLogin: false
      })
    }
  },
  // 添加到企业集团
  bindAddGroupMenber: function (e) { 
    let that = this
    if (that.data.companyStatus == 1 || that.data.companyStatus == 2){ // 已添加
      return;
    }
    if (wx.getStorageSync('access_token')) {
      let companyId = e.currentTarget.dataset.id;
      let companyName = e.currentTarget.dataset.name;
      let params = []
      let detail = {}
      detail['patchType'] = 'ADD';
      detail["objectCategory"] = "Link";
      detail["objectId"] = null
      detail['objectType'] = 'companyGroupMember'
      detail['objectDetails'] = {
        "in": {
          "@id": that.data.coreId,
          "@type": [
            'Company', "Thing"
          ],
          "name": that.data.coreCompanyName
        },
        "out": {}
      }
      detail['objectDetails']['out']['@id'] = companyId
      detail['objectDetails']['out']['name'] = companyName
      detail['objectDetails']['out']['extType'] = { "6": { "editType": "ADD" } }
      detail['objectDetails']['out']['@type'] = ["Company", "Thing"]

      params.push(detail)
      httpRequest({
        url: get_api_user + '/patches/batchSave',
        data: params,
        method: 'POST'
      }).then((res) => {
          app.globalData.groupEditStatus = true
          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 3000
          });
          that.setData({
            companyStatus: 1
          })
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
    } else {
      wx.showModal({
        title: '提示',
        content: '登录后才可进行集团编辑，是否登录？',
        success: function (res) {
          console.log(res)
          if (res.confirm) {
            getApp().router.navigateTo({
              url: '../loginIndex/loginIndex'
            })
          } 
        }
      })
    }
  },
  // 判断该企业是否为集团下的企业
  groupDiff: function(id){ 
    let that = this
    let coreCompany = app.globalData.coreGroupInfo
    let status = 0
    that.setData({
      coreId: coreCompany && coreCompany.id,
      coreCompanyName: coreCompany && coreCompany.name
    })
    if (coreCompany.id == undefined){
      return
    }
    if (wx.getStorageSync('access_token')) {
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
            "memberList": [
              id
            ],
            "termList": [
              coreCompany.id
            ],
            "paramPersonEquiv": [
              [
                "string"
              ]
            ],
            "propertyPath": coreCompany.type + ".id",
            "page": 1,
            "size": 10
          }
        }).then((res) => {
            let results = res || {}
            for(let item in results){
              for (let key in results[item]){
                if (results[item][key] === 'SYS') {
                  status = 2
                } else if (results[item][key] === 'ADD') {
                  status = 1
                }
              }
            }
            if (coreCompany.id === id){
              status = 2
            }
            that.setData({
              isLoad: false,
              companyStatus: status
            })
        }).catch((errMsg) => {
          console.log(errMsg);//错误提示信息
        });
    }else{
        that.setData({
          isLoad: false
        })
    }
  },
  // 获取工商信息  **** V0.8版本接口调整 缺少刷新时间
  getEntityInfo: function (kgId){
    let that = this;
    let payload = {
      "kgId": kgId 
    }
    wx.request({
      url: get_api_kg + '/detail/company/basic',
      // url: get_api_user + '/entityInfo/byName/overview',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": that.data.apiKey
      },
      success: function (res) {
        let results = res.data && res.data.result && res.data.result[0]; 
        // console.log('获取工商信息', results) 
        if (results != undefined) {
          that.handleEntityData(results)
          let refreshDate = ''
          if (results.dateModified){
            let T_pos = results.dateModified && results.dateModified.indexOf('T');
            refreshDate = results.dateModified.substr(0, T_pos);
          }
          let dateModified = that.data.businessDateModified && utcBeijing(that.data.businessDateModified)
          let timestamp = Date.parse(new Date())/1000;
          // 距离上次刷新未超过设定时间 展示最后的刷新时间否则可点击刷新
          if (timestamp - dateModified < that.data.expireAfter) {
            that.setData({
              isRefresh: false,
              finalRefreshDate: refreshDate
            })
          }else{
            that.setData({
              isRefresh: true
            })
          }
        }
      }
    })
  },
  // 点击刷新工商信息
  refreshEntityData: function () {
    let that = this
    if (wx.getStorageSync('access_token')) {
      that.setData({
        isUpdating: true
      })
      let dateModified = that.data.businessDateModified && utcBeijing(that.data.businessDateModified)
      let timestamp = Date.parse(new Date())/1000;
      console.log('222',timestamp , dateModified , that.data.expireAfter)
      // 距离上次刷新未超过设定时间不重复操作
      if (timestamp - dateModified > that.data.expireAfter){
        let payload = {
          "name": that.data.entityName,
          "expireAfter": that.data.expireAfter
        }
        wx.request({
          header: {
            "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
          },
          url: get_api_user + '/entityInfo/byName/overview',
          method: 'POST',
          data: payload,
          success: function (res) {
            let results = res.data  //.result.entity
            let refreshDate = '';
            if (results != undefined) {
              if (results.dateModified) {
                let T_pos = results.dateModified && results.dateModified.indexOf('T');
                refreshDate = results.dateModified.substr(0, T_pos);
              }
              that.setData({
                isUpdating: false,
                isRefresh: false,
                finalRefreshDate: refreshDate
              })
              that.handleEntityData(results)
            }
          }
        })
      }else{
        setTimeout(function(){
          that.setData({
            isUpdating: false
          })
        }, 1000)
      }
    } else {
      wx.showModal({
        title: '提示',
        content: '登录后才可进行集团编辑，是否登录？',
        success: function (res) {
          console.log(res)
          if (res.confirm) {
            getApp().router.navigateTo({
              url: '../loginIndex/loginIndex'
            })
          }
        }
      })
    }
  },
  // 处理工商信息
  handleEntityData: function (results){
      let that = this
      that.data.companyPersonList.forEach(item => {
        // 判断是否是董监高
        // results.listManagerRole && results.listManagerRole.forEach(mItem => {
        //   if (item.name === mItem.name) {
        //     mItem['isSomebody'] = true
        //   }
        // })
        // if (item.name === results.nameLegalRepresentative) {
        //   results['isSomebody'] = true
        // }
        if (item.name === results.LegalRepRole.name) {
          results['isSomebody'] = true
        }
      })

      if (results.regStatus) {
        let status = results.regStatus.slice(0, 2)
        results.regStatus = status
      }
      // 处理注册资本
      if (results.regCapitalValue) {
        results['regCapitalValue'] = numFormat(results.regCapitalValue)
      }
      that.setData({
        isLoad: false,
        basicInfo: results,
        businessDateModified: results.dateModified || "",
        companyId: results['@id']
      })
      //that.groupDiff(results['@id']);
  },
  // 获取公司的董监高
  getCompanyPersonData: function(comName){
    let that = this
    wx.request({
      url: 'https://aq9sihrz84.execute-api.cn-northwest-1.amazonaws.com.cn/demo/v2/tkyc/listPersonByCompany',
      method: 'POST',
      data: {
        name: comName
      },
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data && res.data.kgObjectList
        if (results && results.length) {
          that.setData({
            companyPersonList: results
          })
        }
        let kgId = that.data.kgId;
        that.getEntityInfo(kgId);
        that.getShareholderData(kgId)
      }
    })
  },
  // 获取股东信息
  getShareholderData: function (kgId) {
    let that = this;
    let payload = {
      "kgId": kgId
    }
    wx.request({
      url: get_api_kg + '/detail/company/shareholder',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": that.data.apiKey
      },
      success: function (res) {
          let results = res.data && res.data.result; 
          let shareholderData = results
          // 股东信息
          if (shareholderData && shareholderData.length) {
            shareholderData.forEach(item => {
              let shareholderEquity = item.amountValue
              let shareholderEquityRatio = item.ratio
              item['shareholderCreditValue'] = shareholderEquity != '-' ? numFormat(shareholderEquity) : '-'
              item.shareholderEquityRatio = item.shareholderEquityRatio != '-' ? toDecimalNoZero(shareholderEquityRatio * 100) : 0
              if (item.kgTypeMain == "Person") {
                that.data.companyPersonList.forEach(citem => {
                  // 判断是否是董监高
                  if (citem.name === item.name) {
                    item['isSomebody'] = true
                  }
                })
              }
            })
          }
          that.setData({
            moreLoading: false,
            shareholderInfo: shareholderData
          })
        }
    })
  },
  // 获取对外投资    **** V0.8版本接口调整 缺少法定代表人（法定代表人类型人/公司），投资比例，经营状态，成立日期
  getInvestmentRoleData: function (kgId) {
    let that = this;
    this.setData({
      showInvestment: true
    })
    let payload = {
      "kgId": kgId
    }
    wx.request({
      url: get_api_kg + '/detail/company/investment',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": that.data.apiKey
      },
      success: function (res) {
          let results = res.data && res.data.result; 
          let investmenData = results
          // 对外投资
          if (investmenData && investmenData.length) {
            investmenData.forEach(item => {
              item.investeeSaicRegistrationStatus = item.investeeSaicRegistrationStatus && item.investeeSaicRegistrationStatus.slice(0, 2)
              item.regCapitalValue = item.investeeSaicRegistrationCapital && numFormat(item.investeeSaicRegistrationCapital.value)
              // item.investmentEquityRatio = item.investmentEquityRatio
              let investmentEquity = item.amountValue
              item['investmentCreditValue'] = numFormat(investmentEquity)
              if (item.kgTypeMain == "Person") {
                that.data.companyPersonList.forEach(citem => {
                  // 判断是否是董监高
                  if (citem.name === item.name) {
                    item['isSomebody'] = true
                  }
                })
              }
            })
          }
          that.setData({
            moreLoading: false,
            investmenInfo: investmenData
          })
        } 
    })
  },
  // 获取主要人员
  getManagerData: function (kgId) {
    let that = this;
    let payload = {
      "kgId": kgId
    }
    this.setData({
      showManager: true
    })
    wx.request({
      url: get_api_kg + '/detail/company/manager',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": that.data.apiKey
      },
      success: function (res) {
          let results = res.data && res.data.result;
          let managerData = results
          // 对外投资
          if (managerData && managerData.length) {
            managerData.forEach(item => {
              if (item.kgTypeMain == "Person") {
                that.data.companyPersonList.forEach(citem => {
                  // 判断是否是董监高
                  if (citem.name === item.name) {
                    item['isSomebody'] = true
                  }
                })
              }
            })
          }
          that.setData({
            moreLoading: false,
            managerInfo: managerData
          })
        }
    })
  },
  // 获取股质出权   **** V0.8版本接口调整： 缺少出质人/质权人 类型
  getEquityPledgeData: function (kgId) {
    let that = this;
    let payload = {
      "kgId": kgId
    }
    this.setData({
      showPledge: true
    })
    wx.request({
      url: get_api_kg + '/detail/company/pledge',
      // url: get_api_user + '/entityInfo/byName/neighbors',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": that.data.apiKey
      },
      success: function (res) {
          let results = res.data && res.data.result
        // console.log('股权', results)
          let equityPledge = results
          if (equityPledge && equityPledge.length) {
            equityPledge.forEach(item => {
              // 字符大于4 为公司  能点击
              // let pledgeeName =  item.pledgeeName.replace(/[(|)]/g, "")
              // let pledgorName = item.pledgorName.replace(/[(|)]/g, "")

              // 1为公司  2为人
              if (item.ppPledgeeType == 1){
                item['pledgeeIsCompany'] = true
              }
              if (item.ppPledgorType == 1) {
                item['pledgorIsCompany'] = true
              }
              // 为人物  则判断是否是董监高
              if (item.ppPledgeeType == 2){
                that.data.companyPersonList.forEach(citem => {
                  if (citem.name === item.pledgeeName) {
                    item['isSomebody'] = true
                  }
                })
              }
              if (item.ppPledgorType == 2) {
                that.data.companyPersonList.forEach(citem => {
                  if (citem.name === item.pledgorName) {
                    item['isSomebody'] = true
                  }
                })
              }
              item['pledgeAmount'] = item['amount'] && numFormat(item['amount'])
            })
          }
          that.setData({
            moreLoading: false,
            equityPledgeInfo: equityPledge
          })
        }
    })
  },
  // 单体企业维度涉案分析
  getRiskScoreData: function (companyId){
    let that = this
    this.setData({
      showLawsuit: true
    })
    let payload = {
      "termList": [companyId],
      "propertyPath": "CompanyGroupCoreMemberRole.out.Company.id",
      "kgExpectTypeList": [
        "Company"
      ],
      "paramShareholderEquityRatioMin": null,
      "paramShareholderChainDepthMax": null,
      "kgContextLinkList": null
    }
    wx.request({
      url: get_api_url + '/ckyc/matchCompanyGroup',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let results = res.data.kgObjectList && res.data.kgObjectList[0]
        if (results){
          let kycReport = results.kgContextEntityList.filter((item) => {
            return item['@type'].includes('CompanyGroupKycReport')
          })
          let mainComData = {}
          if (kycReport.length){
            mainComData = kycReport[0]
            mainComData.lawsuitCreditTotal.value = mainComData.lawsuitCreditTotal && numFormat(mainComData.lawsuitCreditTotal.value)
            mainComData.lawsuitCreditForWin.value = mainComData.lawsuitCreditForWin && numFormat(mainComData.lawsuitCreditForWin.value);
            mainComData.lawsuitCreditForLose.value = mainComData.lawsuitCreditForLose && numFormat(mainComData.lawsuitCreditForLose.value);
          }
          that.setData({
            lawsuitInfo: mainComData
          })
        }
        that.setData({
          lawsuitInfoLoad: false,
          moreLoading: false
        })
      }
    })
  },
  onReachBottom: function () {
    let that = this;
    let step = this.data.loadStep;
    if (that.data.moreLoading) return;
    if (step > 4){
      wx.showToast({
        title: '没有更多数据啦~',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    step++;
    // if (step == 1) {
    //   // 首次下拉加载单体企业维度涉案分析
    //   this.getRiskScoreData(this.data.companyId);
    //   this.setData({
    //     loadStep: false
    //   })
    // }
    this.setData({
      moreLoading: true,
      loadStep: step
    })
    let kgId = that.data.kgId;
    switch(step){
      case 2: that.getInvestmentRoleData(kgId); break;
      case 3: that.getManagerData(kgId); break;
      case 4: that.getEquityPledgeData(kgId); break;
      case 5: that.getRiskScoreData(that.data.companyId); break;
    }
  },
  getDetailData: function (comName){
    let that = this;
    let payload = {
      "name": comName
    }
    wx.request({
      url: get_api_url + '/entityInfoByName',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        console.log(res.data.result)
        let results = res.data.result
        let shareholderData = [], investmenData = [];
        if (results && results.entity) {
          if (results.entity.saicRegistrationStatus) {
            let status = results.entity.saicRegistrationStatus.slice(0, 2)
            results.entity.saicRegistrationStatus = status
          }
          shareholderData = results.linkList && results.linkList.filter(item => {
            return item['@type'].includes('ShareholderRole')
          })
          investmenData = results.linkList && results.linkList.filter(item=>{
            return item['@type'].includes('InvestmentRole')
          })
          // 股东信息
          if (shareholderData && shareholderData.length){
            shareholderData.forEach(item => {
              let shareholderEquity = JSON.parse(item.shareholderEquity)
              let shareholderEquityRatio = JSON.parse(item.shareholderEquityRatio)
              item['shareholderCreditValue'] = shareholderEquity && shareholderEquity != '-' ? numFormat(shareholderEquity.value):'-' 
              item.shareholderEquityRatio = shareholderEquityRatio
            })
          }
          // 对外投资
          if (investmenData && investmenData.length) {
            investmenData.forEach(item => {
              item.investeeSaicRegistrationStatus = item.investeeSaicRegistrationStatus.slice(0, 2)
              item.investeeSaicRegistrationCapital.value = numFormat(item.investeeSaicRegistrationCapital.value)
              item.investmentEquityRatio = JSON.parse(item.investmentEquityRatio)
              let investmentEquity = JSON.parse(item.investmentEquity)
              item['investmentCreditValue'] = numFormat(investmentEquity.value)
            })
          }
          that.setData({
            basicInfo: results.entity,
            shareholderInfo: shareholderData,
            investmenInfo: investmenData,
            companyId: results.entity['@id']
          })

          //that.groupDiff(results.entity['@id']);
        } else {
          that.setData({
            isLoad: false,
            isNoData: true
          })
        }
      }
    })
  },
  getCompanyData: function(e){
     let name = e.currentTarget.dataset.name;
     if(!name){
       return
     }

     this.setData({
        isLoad: true,
        isNoData: false,
        loadStep: true,
        entityName: name
     })
    this.getCompanyPersonData(name)
    // this.getEntityInfo(name);
    // this.getShareholderData(name)
    // this.getInvestmentRoleData(name);
    // this.getEquityPledgeData(name);
    //  this.getDetailData(name);
  },
  toCaseListPage() {  // 跳转到集团案件列表页面
    let name = JSON.stringify(this.data.basicInfo.name)
    let companyId = JSON.stringify(this.data.basicInfo['@id'])
    getApp().router.navigateTo({
      url: '../caseList/caseList?name=' + name + '&companyId=' + companyId + '&isCompany=1'
    })
  },
  toLawDetail: function () { // 点击法律诉讼列表跳转法律诉讼详情页面
    let that = this
    let name = e.currentTarget.id
    wx.navigateBack({
      url: '../lawDetail/lawDetail?name=' + name
    })
  },
  toNamesakeListPage: function(e){
      let name = e.currentTarget.dataset.name;
      if (!e.currentTarget.dataset.somebody){  // 不是董监高不能跳转
        return
      }
      let personId = ''
      this.data.companyPersonList.forEach(item => {
         if(item.name === name){
           personId = item.id
         }
      })
      if (!personId){
        wx.showToast({
          title: '该人物暂无数据',
          icon: 'none',
          duration: 2000
        })
        return
      }  
    if (wx.getStorageSync('access_token')) {
      getApp().router.navigateTo({
        url: '../namesakeCompanyList/namesakeCompanyList?personName=' + name + "&personId=" + personId
      })
    }else{
      wx.showModal({
        title: '提示',
        content: '登录后才可进行同名人物编辑，是否登录？',
        success: function (res) {
          console.log(res)
          if (res.confirm) {
            getApp().router.navigateTo({
              url: '../loginIndex/loginIndex'
            })
          }
        }
      }) 
    }
  },
  toPrePage: function(){
    wx.navigateBack({})
  },
  toHomeIndex: function () {
    wx.switchTab({
      url: '../index/index',
      success: function (e) {
        var page = getCurrentPages().pop();
        if (page == undefined || page == null) return;
        page.onLoad();     
      } 
    })
  }
})