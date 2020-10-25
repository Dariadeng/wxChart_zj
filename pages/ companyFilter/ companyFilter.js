// pages/ companyFilter/ companyFilter.js
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat , HashMap } from '../../utils/util.js'
const app = getApp()

Page({
  data: {
    isLoad: true,
    isLogin: false,
    isMainLoad: false,
    isNoData: false,
    select_all: true, 
    middlearr: [],
    count: 0,
    progress_txt:'',
    management_company: false,  // 设置企业集合范围标示
    mainEntityCom:{},  // 核心企业信息
    mainData: [],  // 集团信息
    companyList: [],  // 每页的关联公司列表
    allCompanylist: [], // 全部关联公司列表
    companyListCount: 0,
    companyListBackup: [],  // 关联公司列表 -- 备份
    coreMemberId: ' ',  // // 核心企业id
    loadFlag: false,
    isClickAddBtn:false,  // 是否点击添加企业
    riskDialogFlag: false,  
    comDialogFlag: false,
    page: 1,
    pageNumber: 10,
    totalPage:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      coreMemberId: options.name,
      loadFlag: true
    })
    // 是否登陆？ 带token请求
    if (wx.getStorageSync('access_token')) {
      this.getCompanyList(options.name, false);
    }else{
      this.getGroupListByid(options.name)
    }
  },
  // 用户没有登陆的时候 ------- 获取企业集合数据
  getGroupListByid: function (coreName){
    let that = this
    wx.request({
        url: get_api_user + '/companyGroupMembers/findByCoreMemberId',
        data: {
          "coreMemberId": coreName   
        },
        method: 'GET',
        success: function (res) {
          let results = res.data.kgObjectList && res.data.kgObjectList[0]
          that.getGroupInfo(results, false)
        }
    });     
  },
  // 数据处理
  getGroupInfo: function (results, userFlag){
    let that = this
    let companyListData = [], mainComData = {},
      memberRoleData = [], mainCompany = {};
    if (results) {
      let companyCount = 0

      mainComData = results.kgContextEntityList.filter((item) => {
        return item['@type'].includes('CompanyGroupKycReport')
      })
      if(mainComData.length){
        mainComData[0].lawsuitCreditTotal.value = mainComData[0].lawsuitCreditTotal && numFormat(mainComData[0].lawsuitCreditTotal.value)
        that.setData({
          mainData: mainComData[0],
          progress_txt: mainComData[0].riskScoreByLawsuit.toFixed(0)
        })
      }
      //绘制背景
      that.drawProgressbg();
      //开始progress
      that.startProgress();

      memberRoleData = results.kgContextLinkList.filter((item) => {
        return item['@type'].includes('CompanyGroupMemberRole')
      })
      // about映射
      let aboutMap = new HashMap();
      results.kgContextLinkList.forEach((item) => {
        if (item['@type'].includes('about')){
          aboutMap.put(item.out['@id'],item)
        }
      })
      // kgContextEntityList映射
      let entityMap = new HashMap();
      results.kgContextEntityList.forEach((item) => {
        if (item['@type'].includes('CompanyKycReport')) {
          entityMap.put(item['@id'], item)
        }
      })
      //提取数据方向：kgContextLinkList 的CompanyGroupMemberRole对应id -》 kgContextLinkList的about的id -》kgContextEntityList
      memberRoleData.forEach((item, index) => {
        let detailId = ''
        let detailResult = {};
        let about = aboutMap.get(item.out['@id'])
        // 有对应的about的就有CompanyKycReport，没有补缺省值
        if (about) { 
          detailId = about.in['@id'];
          // 获取 CompanyKycReport
          detailResult = JSON.parse(JSON.stringify(entityMap.get(detailId)))
          if (!detailResult.lawsuitCountTotal || !detailResult.lawsuitCountForLose) {
            detailResult['loseRatio'] = 0 + "%"
            detailResult['defendantRatio'] = 0 + "%"
          } else {
            detailResult['loseRatio'] = (detailResult.lawsuitCountForLose / detailResult.lawsuitCountTotal * 100).toFixed(2) + '%'
            detailResult['defendantRatio'] = (detailResult.lawsuitCountAsDefendant / detailResult.lawsuitCountTotal * 100).toFixed(2) + '%'
          }
          detailResult['shareholderChainDepth'] = item.shareholderChainDepth
          detailResult['shareholderEquityRatio'] = item.shareholderEquityRatio
          detailResult.riskScoreByLawsuit = detailResult.riskScoreByLawsuit && detailResult.riskScoreByLawsuit.toFixed(0)
          if (detailResult.lawsuitCreditTotal) {
            detailResult['lawsuitCreditTotalValue'] = numFormat(detailResult.lawsuitCreditTotal.value);
          }
          if (detailResult.lawsuitCreditForLose) {
            detailResult['lawsuitCreditForLoseValue'] = numFormat(detailResult.lawsuitCreditForLose.value);
          }
        }
        detailResult['company_id'] = item.out['@id']  // 公司id
        detailResult['editType'] = item.editType;  // 补丁类型
        detailResult['editTimestamp'] = item.editTimestamp;  // 补丁改动时间
        detailResult['patchId'] = item.patchId  // 补丁id
        detailResult['name'] = item.out.name;
        // 登陆后判断公司删除状态。否则为默认
        if (userFlag){
            detailResult['checked'] = item.editType.toLowerCase() === 'DEL'.toLowerCase() ? false : true;
        }else{
            detailResult['checked'] = true;
        }
        if (detailResult['checked']) companyCount++;
        detailResult['relationships'] = item.name // 关联关系
        // 核心企业时
        if (item.name === '核心企业') {
          mainCompany = detailResult
          // 核心企业id
          mainCompany['coreId'] = item.out['@id']
          wx.setStorage({
            key: 'coreGroupName',
            data: mainCompany.name,
          })
        } else {
          companyListData.push(detailResult)
        }
      })

      that.setData({
        mainEntityCom: mainCompany,
        companyListCount: companyCount - 1, // 关联企业个数
        select_all: companyCount - 1 != 0,
        totalPage: companyListData.length,
        isLoad: false,
        isNoData: false,
        loadFlag: false
      })

      app.globalData.coreMemberCompany = mainCompany

      let newCompanyList = []
      let aboutData = []
      companyListData.forEach(item => {
         if(item.editType == 'ADD'){
           item['isCustomize'] = true // 自定义标签
           aboutData.push(item)
         }
      })
      let defalutComData = companyListData.filter(item => {
        return item.editType !== 'ADD'
      })
      // 用户自定义添加的企业，按照添加的时间顺序，依次排列在在核心企业下方
      if (aboutData.length){
        aboutData = aboutData.sort(function (val1, val2) {
          return val1.editTimestamp - val2.editTimestamp;
        })
        newCompanyList = newCompanyList.concat(aboutData.reverse())
      }
      if (defalutComData.length){
        newCompanyList = newCompanyList.concat(that.sortCompany(defalutComData));  // 公司排名
      }
      that.setData({
        [`companyList[${that.data.page - 1}]`]: newCompanyList.slice(0, that.data.pageNumber)
      })
      that.setData({
        allCompanylist: JSON.parse(JSON.stringify(newCompanyList)),
        companyListBackup: JSON.parse(JSON.stringify(newCompanyList))
      })
    } else {
      that.setData({
        isLoad: false,
        isNoData: true
      })
    } 
  },
  // 用户已登陆********获取企业集合数据
  getCompanyList: function (coreName){
    let that = this;
    httpRequest({
      url: get_api_user + '/companyGroupMembers/findByCoreMemberId',
      data: {
        "coreMemberId": coreName
      },
      method: 'GET',
    }).then((res) => {
      let results = res.kgObjectList && res.kgObjectList[0]
      that.getGroupInfo(results, true)
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 用户已登陆********获取删除添加后  集合风险数据
  getMainData: function (coreName) {
    let that = this;
    httpRequest({
      url: get_api_user + '/companyGroupMembers/findByCoreMemberId',
      data: {
        "coreMemberId": coreName
      },
      method: 'GET',
    }).then((res) => {
      let results = res.kgObjectList && res.kgObjectList[0]
      let mainComData = {}
      if (results) {
        mainComData = results.kgContextEntityList.filter((item) => {
          return item['@type'].includes('CompanyGroupKycReport')
        })
        mainComData[0].lawsuitCreditTotal.value = mainComData[0].lawsuitCreditTotal && numFormat(mainComData[0].lawsuitCreditTotal.value)
        that.setData({
          isMainLoad:false,
          progress_txt: mainComData[0].riskScoreByLawsuit.toFixed(0),
          mainData: mainComData[0]
        })
        //开始progress
        that.startProgress();
      }

    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 默认关联企业排序
  sortCompany: function(data){
    // return data.sort(function (val1, val2) {
    //   // 单体企业分数*实控比例进行排序。实控比例为空时按分数大小排序整体排在实控比例不为0的企业的下方。
    //   let result1 = (val1.riskScoreByLawsuit || 0) * (val1.shareholderEquityRatio || 0)
    //   let result2 = (val2.riskScoreByLawsuit || 0) * (val2.shareholderEquityRatio || 0)
    //   return result2 - result1;      
    // })
    //按照涉案金额排，涉案金额相同按照分数排，分数相同按照实控比例排。实控比例相同时，随机排序。
    return data.sort(function (val1, val2) {
      let lawsuitCreditTotal2 = val2.lawsuitCreditTotal && val2.lawsuitCreditTotal.value || 0
      let lawsuitCreditTotal1 = val1.lawsuitCreditTotal && val1.lawsuitCreditTotal.value || 0
      if (lawsuitCreditTotal2 > lawsuitCreditTotal1) {
        return 1
      }
      if (lawsuitCreditTotal2 < lawsuitCreditTotal1) {
        return -1
      }
      if (lawsuitCreditTotal2 == lawsuitCreditTotal1) {
        let riskScoreByLawsuit2 = val2.riskScoreByLawsuit || 0
        let riskScoreByLawsuit1 = val1.riskScoreByLawsuit || 0
        if (riskScoreByLawsuit2 > riskScoreByLawsuit1) {
          return 1
        }
        if (riskScoreByLawsuit2 < riskScoreByLawsuit1) {
          return -1
        }
        if (riskScoreByLawsuit2 == riskScoreByLawsuit1) {
          let shareholderEquityRatio2 = val2.shareholderEquityRatio || 0
          let shareholderEquityRatio1 = val1.shareholderEquityRatio || 0
          if (shareholderEquityRatio2 > shareholderEquityRatio1) {
            return 1
          }
          if (shareholderEquityRatio2 < shareholderEquityRatio1) {
            return -1
          }
        }
      }
     })
  },
  /**
 * 画progress底部背景
 */
  drawProgressbg: function () {
    // 使用 wx.createContext 获取绘图上下文 context
    var ctx = wx.createCanvasContext('canvasProgressbg')
    // 设置圆环的宽度
    ctx.setLineWidth(3);
    // 设置圆环的颜色
    ctx.setStrokeStyle('#f2b2b3');
    // 设置圆环端点的形状
    ctx.setLineCap('round')
    //开始一个新的路径
    ctx.beginPath();
    //设置一个原点(110,110)，半径为100的圆的路径到当前路径
    ctx.arc(65, 65, 46, 0, 2 * Math.PI, false);
    //对当前路径进行描边
    ctx.stroke();
    //开始绘制
    ctx.draw();
  },

  /**
   * 画progress进度
   */
  drawCircle: function (step) {
    // 使用 wx.createContext 获取绘图上下文 context
    var context = wx.createCanvasContext('canvasProgress');
    // 设置圆环的宽度
    context.setLineWidth(3);
    // 设置圆环的颜色
    context.setStrokeStyle('#FFFFFF');
    // 设置圆环端点的形状
    context.setLineCap('round')
    //开始一个新的路径
    context.beginPath();
    //参数step 为绘制的圆环周长，从0到2为一周 。 -Math.PI / 2 将起始角设在12点钟位置 ，结束角 通过改变 step 的值确定
    context.arc(65, 65, 46, -Math.PI / 2, step * Math.PI - Math.PI / 2, false);
    //对当前路径进行描边
    context.stroke();
    //开始绘制
    context.draw()
  },
  /**
   * 开始progress
   */
  startProgress: function () {
    this.setData({
      count: 0
    });
    let maxNum = this.data.progress_txt/100*6;
    // 设置倒计时 定时器 每100毫秒执行一次，计数器count+1 ,耗时6秒绘一圈
    this.countTimer = setInterval(() => {
      if (this.data.count <= maxNum) {
        this.drawCircle(this.data.count / (6 / 2))
        this.data.count++;
      }
    }, 100)
  },
  // 开始设置企业管理范围
  handleSelect: function(){
    if (!wx.getStorageSync('access_token')){
      wx.showModal({
        title: '提示',
        content: '登录后才可进行集团编辑，是否登录？',
        success: function (res) {
          if (res.confirm) {
            app.router.navigateTo({
              url: '../loginIndex/loginIndex'
            })
          } else {
            console.log('用户点击了取消')
          }
        }
      })
    }else{
      this.setData({
        management_company: true,
      })
    }
  },
  // 选择
  select: function (e) {
    var that = this;
    let arr2 = [];
    var out_index = e.currentTarget.dataset.cid;
    var arr = that.data.companyList[out_index];
    var index = e.currentTarget.dataset.id;
    arr[index].checked = !arr[index].checked;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr2.push(arr[i])
      }
    };
    let allArr  = that.data.allCompanylist
    allArr.forEach(item=>{
      if (item.company_id == arr[index].company_id){
        item.checked = arr[index].checked
      }
    })
    that.setData({
      [`companyList[${out_index}]`]: arr,
      //companyList: arr,
      allCompanylist: allArr,
      middlearr: arr2
    })
  },
  sureListScope: function(){  // 跳转到企业集合分析页面
     var that = this;
     // 设置企业范围后才能跳转
    if (!that.data.management_company){
      let companyIdList = []
      let coreCompanyId = that.data.mainEntityCom.coreId
      companyIdList.push(coreCompanyId)
      // 获取公司集合,
      that.data.allCompanylist.forEach((item) => {
        if (item.checked) {
          companyIdList.push(item.company_id)
        }
      })
      let data = that.data.mainData
      wx.setStorageSync('mainLawsuitData', data)
      let name = JSON.stringify(that.data.mainEntityCom.name)
      let coreId = JSON.stringify(coreCompanyId)
      app.globalData.groupCaseIds = companyIdList
      app.router.navigateTo({
        url: '../involvedRisk/involvedRisk?coreId=' + coreId + '&name=' + name + '&isCompany=0'
      })
    }else{
        wx.showToast({
          title: '请确认范围',
          icon: 'none',
          duration: 2000
        })
    }
  },
  toCasePage: function (e) {  // 单个企业跳转案件列表页
    if (this.data.management_company || !e.currentTarget.dataset.checked) {
       return;
    }
    let name = e.currentTarget.dataset.name;  // 企业名称
    // 如果案件数量为0则跳转到工商信息页
    if (e.currentTarget.dataset.lawsuit){
      let coreId = JSON.stringify(this.data.mainEntityCom.coreId)
      let companyId = JSON.stringify(e.currentTarget.id)
      name = name && JSON.stringify(name)
      // isCompany 判断是否为单体企业跳转
      app.router.navigateTo({
        url: '../involvedRisk/involvedRisk?coreId=' + coreId + '&companyId=' + companyId + '&name=' + name + '&isCompany=1'
        //url: '../caseList/caseList?ids=' + ids + '&name=' + name + '&isCompany=1'
      })
    }else{
      app.router.navigateTo({
        url: '../detail/detail?name=' + name
      })
    }
  },
  toMonitorPage: function(){ // 跳转到添加企业页面
    if (wx.getStorageSync('access_token')){
      this.setData({
        isClickAddBtn: true 
      })
      app.router.navigateTo({
        url: '../handleGroup/handleGroup?coreId=' + this.data.mainEntityCom.coreId
      })
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
          } else {
            console.log('用户点击了取消')
          }
        }
      })
    }
  },
  openRiskDialog: function () {  // 企业集合涉诉风险指数 
     this.setData({
       riskDialogFlag: true
     })
  },
  closeRiskDialog: function () {  // 企业集合涉诉风险指数 
    this.setData({
      riskDialogFlag: false
    })
  },
  openComDialog: function () {  // 单体企业涉诉风险指数 
    this.setData({
      comDialogFlag: true
    })
  },
  closeComDialog: function () {  // 单体企业涉诉风险指数 
    this.setData({
      comDialogFlag: false
    })
  },
  // 全选
  select_all: function () {
    let that = this;
    that.setData({
      select_all: !that.data.select_all
    })
    if (that.data.select_all) {
      let listArr = that.data.companyList
      let arr = that.data.allCompanylist;
      let arr2 = [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked == true) {
          arr2.push(arr[i]);
        } else {
          arr[i].checked = true;
          arr2.push(arr[i]);
        }
      }
      let page = that.data.page
      for (let i = 0; i < page; i++) {
        listArr[i] = arr2.slice(10 * i, 10 * i + 10)
      }
      that.setData({
        allCompanylist: arr2,
        companyList: listArr,
        middlearr: arr2
      })
    }
  },
  // 取消全选
  select_none: function () {
    let that = this;
    that.setData({
      select_all: !that.data.select_all
    })
    let listArr = that.data.companyList
    let arr = that.data.allCompanylist;
    let arr2 = [];
    for (let i = 0; i < arr.length; i++) {
      arr[i].checked = false;
      arr2.push(arr[i]);
    }
    let page = that.data.page
    for (let i = 0; i < page; i++) {
      listArr[i] = arr2.slice(10 * i, 10 * i + 10)
    }
    that.setData({
      allCompanylist: arr2,
      companyList: listArr,
      middlearr: []
    })
  },
  //  确认企业集合范围
  sureSelectScope: function(){
    let that = this
    let requstFlag = false
    let arr = that.data.allCompanylist;
    let arrBackup = that.data.companyListBackup;
    let changeArr = arr.filter((item, index) => { 
      return item.checked != arrBackup[index].checked 
    })
    let delArr = changeArr.filter((item) => { return !item.checked })
    let addArr = changeArr.filter((item) => { return item.checked })
    that.setData({
        management_company: !that.data.management_company
    })
    if (delArr.length) {
      let params = []
      delArr.forEach((item) => {
        params.push({
          "action": "DEL",
          "companyGroupId": that.data.mainEntityCom.coreId,
          "companyId": item.company_id
        })
      })
      httpRequest({
        url: get_api_user + '/companyGroupMemberPatches/batchCreate',
        data: params,
        method: 'POST'
      }).then((res) => {
        let results = res
        let companyMap = new HashMap();
        that.data.allCompanylist.forEach((item) => {
          results.forEach(resItem => {
            if (item.company_id === resItem.companyId){
              item['patchId'] = resItem.id
              item['editType'] = resItem.action
            }
          })
        })
        that.setData({
          allCompanylist: that.data.allCompanylist,
          companyListCount: that.data.companyListCount - delArr.length,
          select_all: that.data.companyListCount - delArr.length != 0
        })
        // 添加或删除企业重新计算 集团风险指数
        if (!requstFlag){
          requstFlag = true;
          that.setData({
            companyListBackup: JSON.parse(JSON.stringify(that.data.allCompanylist))
          })
          that.getMainData(that.data.coreMemberId) 
        }
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
    } 
    if (addArr.length){
      let ids =[]
      addArr.forEach((item)=>{
        ids.push(item.patchId)
      })
      httpRequest({
        url: get_api_user + '/companyGroupMemberPatches/batchDelete',
        data: {
          "ids": ids
        },
        method: 'POST'
      }).then((res) => {
        that.setData({
          companyListCount: that.data.companyListCount + addArr.length
        })
        // 添加或删除企业重新计算 集团风险指数
        if (!requstFlag) {
          requstFlag = true;
          that.setData({
            companyListBackup: JSON.parse(JSON.stringify(that.data.allCompanylist))
          })
          that.getMainData(that.data.coreMemberId)
        }
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      });
    } 
    // 添加或删除企业重新计算 集团风险指数
    if (delArr.length || addArr.length) {
      this.setData({
        mainData:{},
        progress_txt:'',
        // isLoad:true,
        isMainLoad:true,
      })
      // this.getMainData(this.data.coreMemberId) 
      // this.getCompanyList(this.data.coreMemberId) 
    }
  },
  onShow: function () {
    // 只有添加企业页面返回 或者登陆返回 才刷新页面
    if (this.data.isLogin || wx.getStorageSync('access_token') && !this.data.loadFlag && app.globalData.isAddGroupMember) {
      this.setData({
        isLoad: true,
        isLogin: false,
        isNoData: false,
        isClickAddBtn: false,
        companyList:[],
        page:1,
        pageNumber:10
      })
      app.globalData.isAddGroupMember = false
      this.getCompanyList(this.data.coreMemberId,true)

    }
  },
  // 下拉加载分页
  onReachBottom: function () {
    var page = this.data.page;
    var pageNumber = this.data.pageNumber;
    var totalPage = this.data.totalPage + 1;
    page++
    pageNumber = pageNumber + 10
    if (pageNumber > totalPage) {
      return;
    }
    let pageData = this.data.allCompanylist.slice(this.data.pageNumber, pageNumber)
    this.setData({
      [`companyList[${page - 1}]`]: pageData,
      pageNumber: pageNumber,
      page: page
    })
  }
})