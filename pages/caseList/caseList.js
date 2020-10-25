// pages/caseList/caseList.js 案件列表页
import { get_api_url, get_api_kg } from '../../utils/config.js'
import { numFormat } from '../../utils/util.js'
const app = getApp()

Page({
  data: {
    coreName: '',
    allCompanyIds:[],  // 企业集合id
    companyId:[], //单体企业id
    requestCompanyIds: [], // 企业集合批量请求id
    isLoading: true,
    isfirstLoad: true,
    isNoData: false,
    caseLoading: false,
    isSort:false,
    caseList:[],
    curPage: 1,    //分页请求
    pageNumber: 20,
    totalPage: null,    //总页数
    isCompany: 0, // 0为企业集合  1为单体企业
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let ids = [], companyId = []
    let name = options.name && JSON.parse(options.name)
    let company = 0
    if (options.isCompany == 1){
        company = 1 
        companyId = JSON.parse(options.companyId)
    }else{
        ids = app.globalData.groupCaseIds 
    }
    this.setData({
      coreName: name,
      allCompanyIds: ids,
      companyId: companyId,
      requestCompanyIds: ids.slice(0, this.data.pageNumber),
      isCompany: company
    })
    this.getCaseList();
  },
  // 获取案件列表
  getCaseList: function () {
    let that = this;
    let curPage = that.data.curPage;
    // if (that.data.allCompanyIds.length){
    //   that.setData({
    //     allCompanyIds: that.data.allCompanyIds.slice(that.data.pageNumber)
    //   })
    // }
    // let payload = {
    //   "kgResultPageNumber": curPage,
    //   "termList": that.data.isCompany ? [ that.data.companyId ]  :that.data.requestCompanyIds,
    //   "propertyPath": "LawsuitPartyRole.out.Company.id",
    //   "kgExpectTypeList": [
    //     "Lawsuit"
    //   ]
    // }

    // ******** 9月接口调整：接口目前只支持单体企业查询   缺少案件公司名称，胜败诉收款 *******
    let payload = {
      "pageNumber": curPage,
      "pageSize": 10,
      "kgId": that.data.companyId
    }
    wx.request({
      url: get_api_kg + "/search/lawsuit",
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": app.globalData.apiKey
      },
      success: function (res) {
        let results = res.data.result;
        if (results && results.length) {
          let caseInfoList = that.data.caseList;
          let infoData = {}, winLose = '';
          let totalPage = Math.ceil(res.data.total / 10)
          results.forEach(function (objItem) {
            // let com_name = ''
            // objItem.kgContextLinkList.forEach(function(item){
            //   // 过滤返回的公司不是 请求入参的公司id集合 中的案件
            //   if (!payload.termList.includes(item.out['@id'])||com_name == item.out.name)return;
            //   com_name = item.out.name;
            //   infoData = JSON.parse(JSON.stringify(that.getCaseInfo(item.in['@id'], objItem.kgMainEntity)));
            //   if (item.nameWinLose === '胜诉方'){
            //     winLose = '胜诉收款'
            //   }else if (item.nameWinLose === '败诉方') {
            //     winLose = '败诉赔款'
            //   }else{
            //     winLose = item.nameWinLose || '其他'
            //   }
            //   let creditValue = ''
            //   if (item.sumOfPaymentCredit && item.sumOfPaymentCredit.value != null) {
            //     creditValue = numFormat(item.sumOfPaymentCredit.value)
            //   }
            //   let data = Object.assign(infoData, {
            //     companyName: item.out.name,
            //     name: item.name,
            //     outId: item.out['@id'],
            //     nameWinLose: item.nameWinLose && item.nameWinLose.slice(0,2),
            //     winLoseCredit: winLose + creditValue || '  '
            //   })
            //   caseInfoList.push(data);
            // })
            objItem['nameWinLose'] = '其他'
            objItem['winLoseCredit'] = '其他' + objItem.totalPayment || '  '
            objItem['companyName'] = objItem.name || that.data.coreName,
            caseInfoList.push(objItem);
          })
          that.setData({
            isNoData: false,
            isLoading: false,
            caseLoading: false,
            caseList: caseInfoList,
            totalPage: totalPage
          })
          // if (that.data.isCompany == 0 && that.data.caseList.length < 6){
          //   that.setData({
          //     requestCompanyIds: that.data.allCompanyIds.slice(0, that.data.pageNumber)
          //   })
          //   that.getCaseList()
          // }else{
          //   that.setData({
          //     isLoading: false
          //   })
          // }
        } else {
          // if (that.data.allCompanyIds.length){
          //   that.setData({
          //     requestCompanyIds: that.data.allCompanyIds.slice(0, that.data.pageNumber)
          //   })
          //   that.getCaseList()
          // }else{
          //   that.setData({
          //     isLoading: false,
          //     caseLoading: false,
          //     isNoData: that.data.isfirstLoad && true
          //   })
          // }
          that.setData({
            isNoData: true,
            isLoading: false
          })
        }
      }
    })
  },
  getCaseInfo :function(id, data){
    let obj = {}
    if (Array.isArray(data)){
      data.forEach(function(item){
        if (item['@id'] === id){
          obj = item
        }
      })
    } else {
      if (data['@id'] === id){
        obj = data
      }
    }
    return obj
  },
  // 跳转 案件详情页面
  toRefereeListPage: function(e){
    let data = this.data.caseList.filter((item)=>{
      return item['kgId'] === e.currentTarget.id
    })
    app.router.navigateTo({
      url: '../caseDetail/caseDetail?data=' + JSON.stringify(data)
    })
  },
 
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();    //在当前页面显示导航条加载动画
    this.onLoad();    //刷新页面
    setTimeout(function () {
      wx.hideNavigationBarLoading();    //在当前页面隐藏导航条加载动画
      wx.stopPullDownRefresh();    //停止下拉动作
    }, 2000)
  },
  // 下拉加载分页
  onReachBottom: function () {
    if (this.data.isfirstLoad){
      this.setData({
        isfirstLoad: false
      })
      return;
    }
    if (this.data.caseLoading){ // 还在发起请求时
      return
    }
    var curPage = this.data.curPage;
    var totalPage = this.data.totalPage;
    curPage++;
    if (curPage > totalPage) {
      // if (this.data.allCompanyIds.length) {
      //   this.setData({
      //     curPage: 1,
      //     totalPage: 0,
      //     caseLoading: true,
      //     requestCompanyIds: this.data.allCompanyIds.slice(0, this.data.pageNumber)
      //   })
      //   this.getCaseList()
      // } 
      wx.showToast({
        title: '没有更多数据啦~',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    this.setData({
      isLoading: false,
      caseLoading: true,
      curPage: curPage
    })
    this.getCaseList();
  }
})