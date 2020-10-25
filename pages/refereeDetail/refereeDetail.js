// pages/lawDetail/lawDetail.js --法律诉讼详情页--
import { get_api_url, get_api_kg } from '../../utils/config.js'
import { numFormat, HashMap } from '../../utils/util.js'

Page({
  data: {
    isFristLoad:true,
    isLoad: true,
    isNoData: false,
    isDocumentLoad:false,
    lawInfo: [],
    partyList: [],
    verdictResultList: {}, // 判决结果
    verdictItemList:[], // 判决项列表
    verdictItemNameMap: null,
    mainEntity: {},
    judicialDocumentId: '',
    judicialDecisionStatementId: '',
    documentData:{}
  },

  onLoad: function (options) {
    this.setData({
      kgId: options && options.kgId
    })
    this.getBasicData(options.kgId);
    this.getPartyData(options.kgId);
    this.getStaffData(options.kgId);
    this.getDetailData(options.kgId) // 获取判决项列表
  },
  // 获取基本信息
  getBasicData: function(id){
    let that = this;
    let payload = {
      "kgId": id
    }
    wx.request({
      url: get_api_kg + '/detail/jdoc/basic',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": getApp().globalData.apiKey
      },
      success: function (res) {
        // console.log(res.data.result)
        let results = res.data.result
        if (results) {
          that.setData({
            isLoad: false,
            isNoData: false,
            mainEntity: results[0]
          })
        }
      }
    })
  },
  // 
  getPartyData: function (id) {
    let that = this;
    let payload = {
      "kgId": id
    }
    wx.request({
      url: get_api_kg + '/detail/jdoc/party',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": getApp().globalData.apiKey
      },
      success: function (res) {
        console.log(res.data.result)
        let results = res.data.result
        if (results) {
          results.forEach((item) => {
            item['totalPayment'] = item['totalPayment'] && numFormat(item['totalPayment'])
          })
          that.setData({
            isLoad: false,
            isNoData: false,
            partyList: results
          })
        }
      }
    })
  },
  getStaffData: function (id) {
    let that = this;
    let payload = {
      "kgId": id
    }
    wx.request({
      url: get_api_kg + '/detail/jdoc/staff',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": getApp().globalData.apiKey
      },
      success: function (res) {
        console.log(res.data.result)
        let results = res.data.result
        if (results) {
          that.setData({
            isLoad: false,
            isNoData: false,
            verdictResultList: results
          })
        }
      }
    })
  },
  // 获取判决项列表
  getDetailData: function (id) {
    let that = this;
    let payload = {
      "kgId": id
    }
    wx.request({
      url: get_api_kg +  '/detail/jdoc/decision',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": getApp().globalData.apiKey
      },
      success: function (res) {
        let results = res.data && res.data.result
        let memberData = [], partyData =[],
            verdictItemList = [], verdictResultList = [];
        if (results) {
          // results.forEach((rItem)=>{
          //   let verdictData = {}, verdictResult = {}
          //   memberData = rItem.kgContextLinkList.filter(item => {
          //     return item['@type'].includes('memberDecisionStatement') 
          //   })
          //   // 被给付方映射
          //   let creditorMap = new HashMap();
          //   rItem.kgContextLinkList.forEach((item) => {
          //     if (item['@type'].includes('JudicialDecisionStatementPayeeRole')) {
          //       creditorMap.put(item.in['@id'], item)
          //     }
          //   })
          //   // 给付方映射
          //   let debtorMap = new HashMap();
          //   rItem.kgContextLinkList.forEach((item) => {
          //     if (item['@type'].includes('JudicialDecisionStatementPayerRole')) {
          //       debtorMap.put(item.in['@id'], item)
          //     }
          //   })
          //   memberData.forEach((item)=>{
          //     if (payload.termList.includes(item.in['@id'])){
          //         verdictData = JSON.parse(JSON.stringify(that.getVerdictData(item.out['@id'], rItem.kgMainEntity)));
          //         let creditorData = creditorMap.get(item.out['@id'])
          //         let debtorData = debtorMap.get(item.out['@id'])
          //         if (creditorData == null && debtorData == null){
          //           return
          //         }
          //         if (creditorData && creditorData['@id']){
          //           verdictData['creditorCompanyName'] = creditorData.out['@type'].includes('Company') ? creditorData.out.name : '';
          //         let docName = that.data.verdictItemNameMap.get(creditorData.out['@id'])
          //         verdictData['creditorName'] = creditorData.out.name + '(' + (docName || '') + ')'
          //         }
          //         if (debtorData && debtorData['@id']) {
          //           verdictData['debtorCompanyName'] = debtorData.out['@type'].includes('Company') ? debtorData.out.name : '';
          //          let docName = that.data.verdictItemNameMap.get(debtorData.out['@id'])
          //           verdictData['debtorName'] = debtorData.out.name + '(' + ( docName ||'') + ')'
          //         }
          //         if (item.paymentCredit && item.paymentCredit.value != null){
          //           item.paymentCredit.value = Math.abs(item.paymentCredit.value)
          //           item.paymentCredit.value = numFormat(item.paymentCredit.value)
          //         }
          //     }            
          //     verdictItemList.push(verdictData);
          //   })
          // })  
          // verdictItemList = verdictItemList.sort(function(val1,val2){
          //    return val1.statementIndex - val2.statementIndex
          // })
          results.forEach((item) => {
            item['debtValue'] = item['debtValue'] && numFormat(item['debtValue'])
            verdictItemList.push(item);
          })
          that.setData({
            isLoad: false,
            isNoData: false,
            verdictItemList: verdictItemList,
          })
        } 
      }
    })
  },
  // 判决项信息
  getVerdictData: function(id,data){
      let obj = {}
      if (Array.isArray(data)) {
        data.forEach(function (item) {
          if (item['@id'] === id) {
            if (item.paymentCredit){
                item.paymentCredit.value = numFormat(item.paymentCredit.value)
            }
            obj = item
          }
        })
      } else {
        if (data['@id'] === id) {
          if (data.paymentCredit) {
            data.paymentCredit.value = numFormat(data.paymentCredit.value)
          }
          obj = data
        }
      }
      return obj;
  },
  // getPartyData: function(id,data){
  //   let arr = []
  //   data.forEach((item) => {
  //     if (item.in['@id'] === id) {
  //         arr.push({
  //           name: item.out.name,
  //           roleName: item.name
  //         })
  //     }
  //   })
  //   return arr;
  // },
  toDetailPage: function(e){  // 点击公司跳转工商信息页
    var that = this;
    let name = e.currentTarget.dataset.name;
    let kgId = e.currentTarget.id
    if (!kgId || !name){
      return
    }
    getApp().router.navigateTo({
      url: '../detail/detail?name=' + name + '&kgId=' + kgId
    })

  },
  onReachBottom: function () {
    if (this.data.isFristLoad){
      // 首次下拉加载文书正文
      this.getDocumentText();
      this.setData({
        isFristLoad: false,
        isDocumentLoad:true
      })
    }
  }, 
  onShow: function () {

  },
  // 获取文书正文
  getDocumentText: function (){
    let that = this;
    // let id = that.data.judicialDocumentId
    // let payload = {
    //   "termList": [
    //     that.data.mainEntity.documentUuid
    //     //"83ae6786-2c7b-4981-8d2a-a72801043454",
    //   ],
    //   "propertyPath": "JudicialDocument.id",
    //   "kgExpectTypeList": [
    //     "JudicialDocument"
    //   ]
    // }
    let payload = {
      "kgId": that.data.kgId
    }
    wx.request({
      url: get_api_kg + '/detail/jdoc/text',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": getApp().globalData.apiKey
      },
      success: function (res) {
        // console.log(res.data.result)
        let results = res.data && res.data.result
        if (results != undefined) {
          let text = results[0].text
          //documentData.text.replace(/\<div/g,"font-size:14px;font-family:PingFangSC-Regular,PingFang SC;font-weight:400;color:rgba(30,30,30,1);line-height:20px;")
          that.setData({
            isLoad: false,
            isNoData: false,
            isDocumentLoad: false,
            documentData: text.replace(/\pt/g, 'rpx'),
          })
        }
      }
    })
  }
})