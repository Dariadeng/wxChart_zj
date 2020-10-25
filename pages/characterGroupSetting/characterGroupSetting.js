// pages/characterGroupSetting/characterGroupSetting.js 设置 人物/企业集合范围
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat, HashMap, toDecimalNoZero} from '../../utils/util.js'
const app = getApp()

Page({
  data: {
    isFirstLoad: true,
    isFirstEdit: true,
    companyLoading: false,
    isLoading: true,
    select_all: true,
    selectedList: [],
    coreCompanyName:[],
    coreCompanyList:[],   // 核心企业的集合
    management_company: false,  // 设置企业集合范围标示
    saveEditing: false,
    resultTotal:0,
    companyList: [],
    oldCompanyList:[],
    companyListBackup:[],
    expandTypeList: {
      '-1': 'coreMember',  // 核心成员 
      1: 'shareholder', // 股东关系 
      2: 'investee',    // 对外投资关系 
      3: 'identifier',  // 名称相似关系  
      4: 'location',    // 地址相近关系 
      5: 'staffholder',       // 人物关联关系
      6: 'companyGroupMember', // 新增企业
      7: 'person'
    },
    expandAllCompanyList: [],  // 全选 拓展的公司 
    expandSingleCompanyList:[],  // 单次 拓展的公司 
    groupType: 1,
    isShowMemberList: true,
    curPage: 1,    // 拓展企业分页请求
    totalPage: 0,    // 拓展企业总页数
    expandCurPage: 1,    // 核心企业分页请求
    expandTotalPage: 0,    // 核心企业总页数
    expendRelationSelectAll: [], // 拓展关系全选 类型和参数
    expendRelationSelectAllBackup: [],
    addGroupData: [], // 新增企业--企业集合
    addGroupDataBackup: [],
    editTips: '',
    editStatusFlag: false
  },
  onLoad: function (options) {
      let coreInfo = app.globalData.coreGroupInfo;
      let id = coreInfo.id
      let type = coreInfo.type
      this.setData({
        // resultTotal: options && options.total,
        groupType: type,
        coreId: id
      })
      if (wx.getStorageSync('access_token')) {
        // this.getAllCoreCompanyName(id, type);
        // this.getCompanyGroupByToken(id, type);
        this.getMemberCompanyByToken(id, type, true)
      } 
  },
  onShow: function(){
    let that = this
    if (app.globalData.expendEditStatus || app.globalData.addEditStatus){
      let newData = [], addGroupData = []
      let selfData = JSON.parse(JSON.stringify(wx.getStorageSync('selfGroupData'))) || []
      let addData = JSON.parse(JSON.stringify(wx.getStorageSync('addCompanyData'))) || []

      if (selfData && selfData.status && selfData.list.length) {
        selfData.status = false
        wx.setStorageSync('selfGroupData', selfData)
        newData = newData.concat(selfData.list)
      }
      if (addData && addData.status && addData.list.length) { // 自建规则拓展的企业      
        addData.status = false
        wx.setStorageSync('addCompanyData', addData)
        newData = newData.concat(addData.list)
        addGroupData = addData.list.filter(item => { // 
          return item.companyType == 'group'
        })
      }

      let sList = [], cList = [];
      if (newData.length) {
        app.globalData.addEditStatus = false
        sList = newData.concat(that.data.selectedList)
        cList = newData.concat(that.data.companyList)
        newData = newData.concat(that.data.expandSingleCompanyList)
        that.setData({
          selectedList: sList,
          expandSingleCompanyList: newData,
          // companyList: cList
        })
      }

      // 新增的企业集合或者人物集合
      if (addGroupData.length) {
        that.setData({
          companyList: [],
          isLoading: true,
          isShowMemberList: true,
          expandCurPage: 1,
          expandTotalPage: 0,
          addGroupData: addGroupData,
          addGroupDataBackup: JSON.parse(JSON.stringify(addGroupData))
        })
        this.getMemberCompanyByToken(addGroupData[0]['@id'], 'Company', true, true)
        //this.getPersonGroup(); // 如果新增的是人那获取人物下的企业集合成员
      }

      // 如果没有添加过企业集合但是有新建企业后  自建规则页面编辑过
      if (!this.data.addGroupData.length && app.globalData.expendEditStatus) {
        that.setData({
          companyList: [],
          curPage: 1,    
          totalPage: 0, 
          isLoading: true,
          isShowMemberList: true
        })
        this.getMemberCompanyByToken(that.data.coreId, that.data.groupType, true)
      }
      
      // // 如果没有添加过企业集合但是新建企业  自建规则页面编辑过
      // if (app.globalData.expendEditStatus){

      // }
    
      // 如果没有添加过企业集合且自建规则页面没有编辑， 但是有新增
      if (!this.data.addGroupData.length && !app.globalData.expendEditStatus && newData.length){
        that.setData({
           companyList: cList
        })
      }
    }
  },
  getAllCoreCompanyName: function (id, type){
    let that = this;
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
          that.setData({
             isLoading: false,
             coreCompanyName: coreCompanyName
          })
        }
      } 
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  getMtachParams: function () {
    let matchParam = app.globalData.companyGroupMatchParam;
    let param = {}
    for (let key in matchParam) {
      if (matchParam[key] != undefined) {
        param[key] = matchParam[key]
      }
    }
    return param;
  },
  // 企业集合 成员 列表 
  getMemberCompanyByToken: function (ids, type, flag, newFlag) {
    let that = this;
    let baseParams = {
      "termList": [
        ids
      ],
      "propertyPath": type + ".id",
      "kgResultPageNumber": that.data.curPage,
      "kgResultPageSize": 10,

    }
    baseParams = Object.assign(baseParams, that.getMtachParams());
    httpRequest({
      url: get_api_user + '/tkyc/matchCompanyGroup',
      data: baseParams,
      method: 'POST',
    }).then((res) => {
      let results = res
      if (results != undefined) {
        // 就判断是不是全选, 相等就是全选
        if (results.kgResultTotal !== results.kgResultActiveTotal) {
          that.setData({
            select_all: false
          })
        }
        if (results.kgMemberList && results.kgMemberList.length) {
          that.handleGroupData(results.kgMemberList, true, null, newFlag)
        }

        let memberToatl = 0
        if (results.kgGroupEntity != undefined){
          memberToatl = results.kgGroupEntity.coreMemberTotal + results.kgGroupEntity.extMemberTotal
        }
        let totalPage = Math.ceil(results.kgResultTotal / 10)
        that.setData({
          totalPage: totalPage || 0,
          resultTotal: memberToatl
        })
      } else {
        that.setData({
          isLoading: false,
          companyLoading: false
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 获取拓展关系列表
  getExpandCompanyData: function(data){
    let that = this;
    // 基本参数
    //  let nameList = app.globalData.coreGroupCompanyName
    let coreInfo = app.globalData.coreGroupInfo;
    let baseParams = {
      "kgExpectTypeList": [
        'Company'
      ],
      "page": that.data.expandCurPage,
      "size": 10,
      "propertyPath": coreInfo.type + ".id." + that.data.expandTypeList[data.extType],
      "termList": [coreInfo.id ]
    };
    let params = Object.assign(baseParams, data.params)
    httpRequest({
      url: get_api_user + '/tkyc/listCompany',
      data: params,
      method: 'POST',
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
    }).then((res) => {
      let results = res
      if (results !=  undefined) {
        if (results.kgObjectList && results.kgObjectList.length) {
          let noSelect = app.globalData.expendRelationNoSelect;
          let list = []
          if (noSelect[data.extType]){
            let noSelectMap = noSelect[data.extType]
            list = results.kgObjectList.filter(item => { 
              return noSelectMap.get(item['@id']) == undefined
            })
          }else{
            list = results.kgObjectList;
          }
          let totalPage = Math.ceil(results.kgResultTotal / 10)
          that.handleGroupData(list, false, data.extType)
          that.setData({
            expandTotalPage: totalPage
          })
        }
      }
    })
  },
  handleGroupData: function (results, flag, addType, newFlag) {
    let that = this;
    if (results) {
      let memberData = that.data.companyList;
      // let selectedArr = that.data.selectedList;
      let coreCompany = that.data.coreCompanyList;
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

          if (item.extType[1] && item.extType[1].equityRatio != undefined) {
            item.extType[1]['showEquityRatio'] = toDecimalNoZero(item.extType[1].equityRatio * 100)
          }
          if (item.extType[2] && item.extType[2].equityRatio != undefined) {
            item.extType[2]['showEquityRatio'] = toDecimalNoZero(item.extType[2].equityRatio * 100)
          }
          if (item.extType['-1']) {
            coreCompany.push(item)
          }
          if (item.extType['-1'] && item.extType['-1'].editType === 'SYS' && !newFlag) {
            item['disableCoreCompany'] = that.data.groupType == 'Company'
            item['isCoreCompany'] = true
          }

          if(flag){
            for (let key in item.extType) {
              if (item.extType[key].editType === 'ADD') {
                item['isCustomize'] = true
              }
            
              item['checked'] = that.data.select_all

            }
            memberData.push(item)
          }else{ // 拓展出来的企业处理
            item['checked'] = true
            item['selfAddType'] = addType
            item.extType[addType].editType == 'DEL'  &&  memberData.push(item)
          }

          // 企业已经编辑过
          let cancelSelect = app.globalData.setRangeCancelSelect
          if (cancelSelect.get(item['@id']) != undefined  && JSON.stringify(cancelSelect.get(item['@id']).extType) == JSON.stringify(item.extType)) {
            item['checked'] = cancelSelect.get(item['@id']).checked
          }

         // 判断是否多条关系都是删除状态，如果是则置灰，不勾选
         item['isDelete'] = Object.values(item.extType).every(extItem => { return extItem.editType == 'DEL' })
          if (item['isDelete']){
            item['checked'] = false
          }

      })
      // 只有拓展关系编辑，并且有新增单体企业或人物时，拼接在列表上方
      if (app.globalData.expendEditStatus && !newFlag){
        app.globalData.expendEditStatus = false
        memberData = that.data.expandSingleCompanyList.concat(memberData)
      }
      that.setData({
        isLoading: false,
        companyLoading:false,
        // selectedList: selectedArr,
        companyList: memberData,
        companyListBackup: JSON.parse(JSON.stringify(memberData)),
        coreCompanyList: coreCompany
      })
    }
  },
  // 跳转新建企业页面
  toAddCompanyPage: function (e) {
    let that = this
    // this.storageChangeCompany()
    if (this.data.saveEditing) {
      this.setData({
        editStatusFlag: true,
        editTips: '保存中，请稍等～'
      })
      setTimeout(function () {
        that.setData({
          editStatusFlag: false,
        })
      }, 2000)
      return;
    }
    getApp().router.navigateTo({
      url: '../addCompanyIndex/addCompanyIndex'
    })
  },
  // 跳转自建规则页面
  toRolesPage: function(e){
      let that = this;
      if (this.data.saveEditing) {
        this.setData({
          editStatusFlag: true,
          editTips: '保存中，请稍等～'
        })
        setTimeout(function () {
          that.setData({
            editStatusFlag: false,
          })
        }, 2000)
        return;
      }
      this.storageChangeCompany()
      getApp().router.navigateTo({
        url: '../selfBuiltRules/selfBuiltRules'
      })
  },
  storageChangeCompany: function(){
    let that = this;
    let noSelectMap = new HashMap();
    let newCompanyLen = that.data.expandSingleCompanyList.length
    let arrBackup = that.data.companyListBackup;
    let oldArr = that.data.companyList.slice(newCompanyLen, that.data.companyList.length)
    oldArr.forEach((item, index) => {
      if (item.checked != arrBackup[index].checked){
        app.globalData.setRangeCancelSelect.put(item['@id'], item)
      }
    })
  },
  // 获取实际控制人信息
  getControlledData: function (e) {
    let that = this;
    let companyName = e.currentTarget.dataset.name;
    let index = e.currentTarget.dataset.index;
    let type = e.currentTarget.dataset.type;
    let list = that.data.companyList
    // 展开收缩
    if (list[index].showController) {
      list[index].showController = false
      that.setData({
        companyList: list
      })
      return;
    }
    // 避免重复请求 实际控制的数据则
    if (list[index]['controllerData'] != undefined) {
      list[index].showController = true
      that.setData({
        companyList: list
      })
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
        if (results && results.kgResult != undefined) {
          results.kgResult['controllerRatio'] = toDecimalNoZero(results.kgResult.actualControllerRatio * 100)
          list[index]['controllerData'] = results.kgResult
        } else {
          list[index]['noControllerData'] = true
        }
        list[index]['showController'] = true
        that.setData({
          companyList: list
        })
      }
    });
  },
  // 跳转实控路径页面
  toControlledPage: function (e) {
    let that = this
    if (this.data.saveEditing) {
      this.setData({
        editStatusFlag: true,
        editTips: '保存中，请稍等～'
      })
      setTimeout(function () {
        that.setData({
          editStatusFlag: false,
        })
      }, 2000)
      return;
    }
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
        +'&begin=' + JSON.stringify(begin) + '&end=' + JSON.stringify(end)
    })
  },
  // 获取人物下的企业集合成员
  getPersonGroup: function(){
    let that = this
    let personList = wx.getStorageSync('addCompanyData') || []
    let personId = []
    personList.forEach(item =>{
      personId.push(item.id)
    })
    httpRequest({
      url: get_api_user + '/tkyc/listCompany',
      data: {
        "termList": personId,
        "propertyPath": "Person.id",
        "kgExpectTypeList": [
          "Company"
        ]
      },
      method: 'POST',
    }).then((res) => {
      console.log('拓展', res)
      let results = res
      let oldData = JSON.parse(JSON.stringify(that.data.companyList))
      if (results) {
        let list = []
        if (results.kgObjectList && results.kgObjectList.length) {
          results.kgObjectList.forEach(item => {
            item['checked'] = false
            list.push(item)
          })
        }
        list.concat(oldData);
        that.setData({
          companyList: list
        })
      }

    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    }) 
  },
  // 确认企业集合范围保存
  sureSelectScope: function(){
    let that = this;
    let params = [];
    if (that.data.saveEditing){
      this.setData({
        editStatusFlag: true,
        editTips: '保存中，请勿重复操作～'
      })
      setTimeout(function () {
        that.setData({
          editStatusFlag: false,
        })
      }, 2000)
      return;
    }
    that.setData({
      saveEditing: true
    })
    if (!that.data.select_all){ // 如果是全不选的情况下
      params.push({
        'type': 'allEdit',
        'checked': false
      })
      that.postCompanyGroupEdit(params);
      return
    }
    let coreCompanyDel = that.data.coreCompanyList.filter(item => {
       return !item.checked   
    })

    // 判断核心企业被选择删除的个数，至少勾选一家核心企业才能够保存结果
    if (coreCompanyDel.length == that.data.coreCompanyList.length){
      wx.showModal({
        title: '提示',
        content: '至少勾选一家核心企业',
      })
       return;
    }
    // 筛选原有企业集合中变化的企业
    let newCompanyLen = that.data.expandSingleCompanyList.length
    let arrBackup = that.data.companyListBackup;
    let oldArr = that.data.companyList.slice(newCompanyLen, that.data.companyList.length)
    let changeArr = oldArr.filter((item, index) => {
      return item.checked != arrBackup[index].checked
    })
    
    changeArr = changeArr.concat(that.data.expandSingleCompanyList || [])
    
    changeArr.forEach(item => {
      if (item.extType[6] != undefined && item.companyType == 'group' 
        || item.extType[7] != undefined){
        params.push({
          'type': 'groupMemberEdit',
          'checked': item.checked,
          'coreMemberId': item['@id'] || item.id,
          // 'coreMemberName': item.name,
          'coreMemberType': item.extType[7] != undefined  ? 'Person' : 'Company' 
        })
      }else{
        params.push({
          'type':  'singleMemberEdit',
          'checked': item.checked,
          'memberId': item['@id'] || item.id,
          'memberName': item.name,
          'extType': item.extType
        })
      }
    })
    
    if (params.length) { // 
      that.postCompanyGroupEdit(params);
    } else {
      wx.showToast({
        title: '您还没有编辑任何企业哦～',
        icon: 'none',
        duration: 2000
      })
    }   
  },
  postCompanyGroupEdit: function (params){
    let that = this
    let coreInfo = app.globalData.coreGroupInfo;
    wx.showLoading({
      title: '保存中...',
    })
    httpRequest({
      url: get_api_user + '/tkyc/companyGroupEdit', //'/patches/batchSave',
      data: {
        "coreMemberId": coreInfo.id,
        "coreMemberType": coreInfo.type,
        "patches": params
      },
      method: 'POST',
    }).then((res) => {
      wx.hideLoading();
      that.setData({
        saveEditing: false
      })
      app.globalData.groupEditStatus = true
      wx.showToast({
        title: '保存成功',
      })
      app.globalData.expendRelationNoSelect = {}
      app.globalData.expendRelationSelectAll = []
      wx.navigateBack({
        delta: 1
      })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  // 增加企业集合成员
  addGroupMember: function (list) {
    let that = this
    let params = []
    let coreInfo = app.globalData.coreGroupInfo;
    let newList = []
    // 每条关系都是一个补丁
    list.forEach(item => {
        for (let key in item.extType) {
            let detail = {}
            detail['patchType'] = 'ADD';
            detail["objectCategory"] = "Link";
            detail["objectId"] = null
            detail['objectType'] = that.data.expandTypeList[key]
            detail['objectDetails'] = {
              "in": {
                "@id": coreInfo.id,
                "@type": [
                  coreInfo.type, "Thing"
                ],
                "name": coreInfo.name
              },
              "out": {}
            }
            detail['objectDetails']['out'] = item
            detail['objectDetails']['out']['@type'] = ["Company", "Thing"]
            params.push(detail)
        }
    })
    return params;
  },
  // 删除企业集合成员
  deleteGroupMember: function (list) { 
    let that = this
    let params = []
    let coreInfo = app.globalData.coreGroupInfo;
    list.forEach(item => {
      for (let key in item.extType) {
          let detail = {}
          detail['patchType'] = 'UPDATE';
          detail["objectCategory"] = "Link";
          detail["objectId"] = null
          detail['objectType'] = that.data.expandTypeList[key]
          detail['objectDetails'] = {
            "in": {
              "@id": coreInfo.id,
              "@type": [
                coreInfo.type , "Thing"
              ],
              "name": coreInfo.name
            },
            "out": {},
            "editType": "DEL"
          }
          detail['objectDetails']['out'] = item
          detail['objectDetails']['out']['@type'] = ["Company", "Thing"]
          params.push(detail)
      }
    })
    return params;
  },
  // 下拉加载分页
  onReachBottom: function () {
    let id = this.data.coreId;
    let type = this.data.groupType == 'Company' ? 'Company' : 'Person'

    // 拓展企业分页加载
    if (this.data.isShowMemberList) {
      let curPage = this.data.curPage;
      let totalPage = this.data.totalPage;
      curPage++;
      if (curPage > totalPage) {
        let addData = this.data.addGroupData.slice(1)
        this.setData({
          addGroupData: addData,
          curPage: 0,
          totalPage: 0
        })
        if (addData.length){
          this.getMemberCompanyByToken(addData[0]['@id'], 'Company')
          return
        }else{
          this.getMemberCompanyByToken(id, type, true)
          return;
        }
        wx.showToast({
          title: '没有更多数据啦~',
          icon: 'none',
          duration: 2000
        })
        return;
      }
      this.setData({
        isloading: false,
        companyLoading: true,
        curPage: curPage
      })
      if (this.data.addGroupData.length){
        this.getMemberCompanyByToken(this.data.addGroupData[0]['@id'], 'Company')
      }else{
        this.getMemberCompanyByToken(id, type)
      }
    } 
  },
  // 选择
  select: function (e) {
    var that = this;
    let disable = e.currentTarget.dataset.disable;
    if (disable) {
      return
    }
    let arr2 = [];
    var arr = that.data.companyList;
    var index = e.currentTarget.dataset.index;
    arr[index].checked = !arr[index].checked;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr2.push(arr[i])
      }
    };
    that.setData({
      companyList: arr,
      //selectedList: arr2
    })
  },
  // 全选
  select_all: function () {
    let that = this;
    that.setData({
      select_all: !that.data.select_all
    })
    if (that.data.select_all) {
      let arr = that.data.companyList;
      let arr2 = [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked == true) {
          arr2.push(arr[i]);
        } else {
          arr[i].checked = true;
          arr2.push(arr[i]);
        }
      }
      that.setData({
        companyList: arr2,
        selectedList: arr2
      })
    }
  },
  // 取消全选
  select_none: function () {
    let that = this;
    that.setData({
      select_all: !that.data.select_all
    })
    let arr = that.data.companyList;
    let arr2 = [];
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i].disableCoreCompany){
        arr[i].checked = false;
      }
      arr2.push(arr[i]);
    }
    that.setData({
      companyList: arr2,
      selectedList: []
    })
  },
  onUnload: function(){
    let that = this
    if (app.globalData.groupEditStatus){ 
      return;
    }
    // 筛选原有企业集合中变化的企业
    let newCompanyLen = that.data.expandSingleCompanyList.length
    let arrBackup = that.data.companyListBackup;
    let oldArr = that.data.companyList.slice(newCompanyLen, that.data.companyList.length)
    let changeArr = oldArr.filter((item, index) => {
      return item.checked != arrBackup[index].checked
    })
    if (newCompanyLen || changeArr.length){
      wx.showModal({
        title: '提示',
        content: '您有未保存的数据，是否保存？',
        success: function(res){
          if (res.confirm) {
            that.sureSelectScope();
          } 
        }
      })
    }
  }
})