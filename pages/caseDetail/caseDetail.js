// pages/caseDetail/caseDetail.js  案件详情页
import { get_api_url, get_api_kg } from '../../utils/config.js'
import { numFormat } from '../../utils/util.js'

Page({
  data: {
    isLoading: true,
    isNoData: false,
    mainEntity:{}, // 案件信息
    caseId:'',
    caseDetailData:[],
    documentResult:[] // 裁判文书判决结果
  },
  onLoad: function (options) {
    this.getLawSuitEntity(options);
    this.getLawSuitList(options);
  },
  // 获取案件信息
  getLawSuitEntity: function (options) {
    let that = this;
    let data = options.data && JSON.parse(options.data)
    that.setData({
      caseId: data[0]['kgId'],
      mainEntity: data[0]
    })
  },
  // 裁判文书列表
  getLawSuitList: function (options) {
    let that = this;
    // let payload = {
    //   "termList": [
    //     that.data.caseId
    //     //"4b0929ff21563e6f42a78f255f7f552f46ca91113e2fa4fbef53c53a8e99fbef"    
    //   ],
    //   "propertyPath": "JudicialDocumentLawsuitRole.out.Lawsuit.id",
    //   "kgExpectTypeList": [
    //     "JudicialDocument"
    //   ]
    // }
    let payload = {
      "kgId": that.data.caseId
    }
    // 9月接口调整   缺少案件身份 ，审判环节，类型， 胜败诉收款
    wx.request({
      url: get_api_kg + "/search/jdoc",
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": getApp().globalData.apiKey
      },
      success: function (res) {
        let results = res.data.result
        if (results) {
          let detailList = [], detailResult = {}, 
            winLoseData = {}, winLose = '', documentResultArr=[];
          results.forEach((objItem)=>{
            // let lawsuitRoleData = objItem.kgContextLinkList.filter((item)=>{
            //   return item['@type'].includes('JudicialDocumentLawsuitRole')
            // })
            // let partyRoleData = objItem.kgContextLinkList.filter((item) => {
            //   return item['@type'].includes('JudicialDocumentPartyRole')
            // })
            // let statementData = objItem.kgContextLinkList.filter((item) => {
            //   return item['@type'].includes('JudicialDecisionStatement') 
            // })
            // lawsuitRoleData.forEach((linkItem)=>{
            //   detailResult = JSON.parse(JSON.stringify(that.getMainEntity(linkItem.in['@id'], objItem.kgMainEntity)))
            //   // 获取裁判文书id
            //   detailResult['judicialDocumentId'] = objItem.kgMainEntity.documentUuid
            //   detailResult['judicialDecisionStatementId'] = linkItem.in['@id']; //that.getJudicialDecisionStatementId(linkItem.in['@id'], statementData)
            //   // detailResult['lawsuitId'] = linkItem.out['@id']  
            //   winLoseData = JSON.parse(JSON.stringify(that.getWinLose(that.data.mainEntity.outId, partyRoleData)))
            //   // 获取裁判文书判决结果
            //   documentResultArr = that.getDocumentData(winLoseData.inId, partyRoleData)
            //   detailResult['documentResultArr'] = documentResultArr
            //   detailList.push(Object.assign(detailResult, winLoseData))
            // })
            detailList.push(objItem)
          })
          that.setData({
            isLoading: false,
            isNoData: false,
           //documentResult: documentResultArr,
            caseDetailData: detailList
          })
        } else {
          that.setData({
            isLoading: false,
            isNoData: true
          })
        }
      }
    })
  },
  getJudicialDecisionStatementId: function (id, data){
    let reslutIds = []
      data.forEach(item=>{
         if(item.in['@id'] === id){
           reslutIds.push(item.out['@id'])
         }
      })
    return reslutIds
  },
  getMainEntity: function(id ,data){
    let obj = {}
    if (Array.isArray(data)) {
      data.forEach(function (item) {
        if (item['@id'] === id) {
          obj = item
        }
      })
    } else {
      if (data['@id'] === id) {
        obj = data
      }
    }
    return obj;
  },
  getDocumentData: function(id,data){
    let arr =  data.filter(item=>{
      return item.in['@id'] === id
    })
    var obj = {}
    var newArr = arr.reduce((cur, next) => {
      obj[next['@id']] ? "" : obj[next['@id']] = true && cur.push(next);
      return cur;
    }, [])
    return newArr
  },
  // 处理 收款字段
  getWinLose: function (id, data){
    let obj = {}, winLose = "";
    if (Array.isArray(data)) {
      data.forEach(function (item) {
        if (item.out['@id'] === id && item.out['@type'].includes('Company')) {
          if (item.nameWinLose === '胜诉方') {
            winLose = '胜诉收款'
          }
          if (item.nameWinLose === '败诉方') {
            winLose = '败诉赔款'
          }
          let creditValue = ''
          if (item.sumOfPaymentCredit){
            creditValue =  numFormat(item.sumOfPaymentCredit.value)
          }
          obj = Object.assign({}, {
            inId: item.in['@id'],
            comName: item.out.name,
            roleName: item.name,
            nameWinLose: item.nameWinLose,
            winLoseCredit: winLose + creditValue,
            creditValue: creditValue
          })
        }
      })
    } else {
      if (data.out['@id'] === id) {
        obj = data
      }
    }
    return obj
  },
  // 跳转 裁判文书详情页
  toRefereeDetailPage: function(e){
    // let detailData = this.data.caseDetailData[e.currentTarget.dataset.idx]
    // let reslut = detailData
    // wx.setStorage({
    //   key: 'caseDetailEntity',
    //   data: reslut,
    // })
    getApp().router.navigateTo({
      url: '../refereeDetail/refereeDetail?kgId=' + e.currentTarget.id
    })
  }
})