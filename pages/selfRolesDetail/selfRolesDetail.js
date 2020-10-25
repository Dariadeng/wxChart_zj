// pages/selfRolesDetail/selfRolesDetail.js 自建规则 多个规则页 
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat, HashMap, toDecimalNoZero } from '../../utils/util.js'
const app = getApp()

Page({
  data: {
    isfirstLoad: true,
    isLoading: true,
    companyLoading: false,
    isNoData: false,
    curPage: 1,    //分页请求
    totalPage: null,    //总页数
    layersArray: ['1', '2', '3', '4', '5', '6'],
    resultsTotal:0,
    select_all: false,
    select_none: false,
    editSelectAll: false,
    editSelectNone: false,
    isAlreadySelectAll: false,
    selectedList:[],
    selectedNumber: 0,
    companyList: [],
    companyListBackup: [],
    // index: 0,  // 
    currentIndex: 0,  // 默认穿透层数6层
    shareholderChainDepth: 0,
    investeeChainDepth: 0,
    minValue: 0,
    maxValue: 100,
    // ratioMin:1,
    // ratioMax:100,
    shareholderRatioMin: 1,
    shareholderRatioMax: 100,
    investeeRatioMin: 1,
    investeeRatioMax: 100,
    rangeValues: [1, 100],  // 初始化范围
    sliderFlag: false,
    pickerFlag: false,
   // distance:0.1,  
    distanceMin: 0.0, // 附近的公司距离
    distanceMax: 0.0, 
    coreInfo:[],
    expandType: 1,  // 拓展类型
    expandName: ['核心成员', '股东关系', '对外投资关系', '名称相似关系', '地址相近关系',  '人物关联关系'],
    expandTypeList:{
      '-1': 'coreMember',  // 核心成员 
      1: 'shareholder', // 股东关系 
      2: 'investee',    // 对外投资关系
      3: 'identifier',  // 名称相似关系  
      4: 'location',    // 地址相近关系 
      5: 'staffholder',       // 人物关联关系
      6: 'companyGroupMember', // 新增企业
      7: 'person'
    },
    timer: null,
    groupMatchParam: {},
    matchParamChange: false
  },

  onLoad: function (options) {
    let matchParam = app.globalData.companyGroupMatchParam;
    // 前后端字段映射表（后端字段 - 前端字段）
    let map = {
      paramShareholderChainDepthMax: 'shareholderChainDepth',
      paramShareholderEquityRatioMin: 'shareholderRatioMin',
      paramShareholderEquityRatioMax: 'shareholderRatioMax',
      paramInvesteeChainDepthMax: 'investeeChainDepth',
      paramInvesteeEquityRatioMin: 'investeeRatioMin',
      paramInvesteeEquityRatioMax: 'investeeRatioMax',
      paramGeoDistanceKmMin: 'distanceMin',
      paramGeoDistanceKmMax: 'distanceMax',
    };

    // 从 matchParam 取出有值的结果，并进行前端 data 的设置
    for (let matchItem in matchParam) {
      if (!!matchParam[matchItem]) {
        if (matchItem == 'paramShareholderEquityRatioMin' 
          || matchItem == 'paramShareholderEquityRatioMax'
          || matchItem == 'paramInvesteeEquityRatioMin'
          || matchItem == 'paramInvesteeEquityRatioMax'){
          this.setData({
            [map[matchItem]]: parseFloat((matchParam[matchItem]*100).toFixed(1))
          })
        }else{
          this.setData({
            [map[matchItem]]: matchParam[matchItem]
          })
        }

      }
    }

    // let nameList = app.globalData.coreGroupCompanyName
    let coreInfo = app.globalData.coreGroupInfo; 
    this.setData({
      expandType: options && options.expandType,
      currentIndex: options.expandType == 1 ? this.data.shareholderChainDepth-1 : this.data.investeeChainDepth-1,
      coreInfo: coreInfo,
      groupMatchParam: matchParam
    })
    wx.setNavigationBarTitle({
      title: this.data.expandName[this.data.expandType]
    })
    this.getCompanyList(coreInfo)
  },

  // 配置人物企业集合
  postDefaultAllocation: function () {
    let that = this
    let params = {}
    params = {
         "paramShareholderChainDepthMax": that.data.shareholderChainDepth,
         "paramShareholderEquityRatioMin": that.data.shareholderRatioMin/100,
         "paramShareholderEquityRatioMax": that.data.shareholderRatioMax/100,
          "paramInvesteeChainDepthMax": that.data.investeeChainDepth,
          "paramInvesteeEquityRatioMin": that.data.investeeRatioMin/100,
          "paramInvesteeEquityRatioMax": that.data.investeeRatioMax/100,
          "paramGeoDistanceKmMin": that.data.distanceMin,
          "paramGeoDistanceKmMax": that.data.distanceMax
    }
 
    httpRequest({
      url: get_api_user + '/profiles/CompanyGroupMatchParam',
      data: params,
      method: 'POST',
    }).then((res) => {
      console.log('配置成功')
      that.getUserAllocation();
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  getUserAllocation: function(){
    httpRequest({
      url: get_api_user + '/profiles/CompanyGroupMatchParam',
      data: {},
      method: 'GET',
    }).then((res) => {
      app.globalData.companyGroupMatchParam = res.properties
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  getCompanyList: function (coreInfo, changeFlag){
    let that = this;
    that.setData({
      isNoData: false
    })
    let params = {};
    let curPage = that.data.curPage;
    let matchParam = that.data.groupMatchParam;


    // 基本参数
    let baseParams = {
      "kgExpectTypeList": [
        'Company'
      ],
      "page": curPage,
      "size": 10
    };
    // 部分扩展公共参数
    let extendParams = {
      "propertyPath": coreInfo.type + ".id." + that.data.expandTypeList[that.data.expandType],
      "termList": [ coreInfo.id ]
    };

    if (changeFlag){
      wx.showLoading({
        title: '加载中...',
      })
    }
    // 拓展关系参数
    let expandParams = {}

    if(that.data.expandType == 1){
      expandParams = {
        "paramShareholderChainDepthMax": that.data.shareholderChainDepth,
        "paramShareholderEquityRatioMin": that.data.shareholderRatioMin/100,
        "paramShareholderEquityRatioMax": that.data.shareholderRatioMax/100,
      }
      params = Object.assign(baseParams, extendParams, expandParams)
    } else if (that.data.expandType == 2){
      expandParams = {
        "paramInvesteeChainDepthMax": that.data.investeeChainDepth,
        "paramInvesteeEquityRatioMin": that.data.investeeRatioMin/100,
        "paramInvesteeEquityRatioMax": that.data.investeeRatioMax/100,
      }
      params = Object.assign(baseParams, extendParams, expandParams)
    } else if (that.data.expandType == 4){
      expandParams = {
          "paramGeoDistanceKmMax": that.data.distanceMax,
          "paramGeoDistanceKmMin": that.data.distanceMin
      }
      params = Object.assign(baseParams, extendParams, expandParams)
    } else if (that.data.expandType == 3){
      params = Object.assign(baseParams, extendParams)
    } else if (that.data.expandType == 5) {
      params = Object.assign(baseParams, extendParams)
    }
    

    // // 判断相同参数路径下是否已经全选
    // let selectAll = app.globalData.expendRelationSelectAll
    // if (selectAll.length && !that.data.isAlreadySelectAll){
    //   selectAll.forEach(item => {
    //     if (item.extType == that.data.expandType
    //       && JSON.stringify(item.params) == JSON.stringify(expandParams)) {
    //       that.setData({
    //         select_all: true,
    //         isAlreadySelectAll: true
    //       })
    //     }
    //   })
    // }


    httpRequest({
      url: get_api_user + '/tkyc/listCompany',
      data: params,
      method: 'POST',
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
    }).then((res) => {
        console.log('拓展',res)
        let results = res
        if(results){
          let list = that.data.companyList
          let selectArr = that.data.selectedList
          let totalPage = Math.ceil(results.kgResultTotal / 10)
          let newSelectArr = []
          // 就判断是不是全选, 相等就是全选
          if (results.kgResultTotal === results.kgResultActiveTotal ){
            that.setData({
              select_all: true
            })
          }
          
          if (results.kgObjectList && results.kgObjectList.length){
            // let selfData = JSON.parse(JSON.stringify(wx.getStorageSync('selfGroupData'))) || []
            results.kgObjectList.forEach(item => {
              if (item.extType[1] && item.extType[1].equityRatio != undefined){
                item.extType[1]['showEquityRatio'] = toDecimalNoZero(item.extType[1].equityRatio*100)
              }
              if (item.extType[2] && item.extType[2].equityRatio != undefined) {
                item.extType[2]['showEquityRatio'] = toDecimalNoZero(item.extType[2].equityRatio*100)
              }
              
              item['checked'] = true

              for (let key in item.extType) {
                if (item.extType[key] && item.extType[key].editType === 'DEL') {
                  item['checked'] = false 
                }
              }
              if (that.data.matchParamChange){
                item['checked'] = true
              }
              if (that.data.editSelectNone){
                item['checked'] = false
              } else if (that.data.editSelectAll){
                item['checked'] = true
              }

              if (item['@id'].length == 36) { // 人物的id长度是36
                item['isPersonType'] = true
              }
              // if (selfData && selfData.list && selfData.list.length) {
              //   selfData.list.forEach(sItem => {
              //     if (sItem['@id'] === item['@id']){
              //       item['checked'] = true
              //     }
              //   })  
              // }
              list.push(item)
            })
          }
          if (list && !list.length){
            that.setData({
              isNoData: true
            })
          }

          that.setData({
            isLoading: false,
            companyLoading: false,
            companyList: list,
            companyListBackup: JSON.parse(JSON.stringify(list)),
            resultsTotal: results.kgResultTotal,
            totalPage: totalPage,
            selectedNumber: results.kgResultActiveTotal
          })
        }
        wx.hideLoading()

    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })  
  },
  // 保存应用
  bindApplication: function(){
      let that = this;
      let params = {}, requestParams = []
      if (that.data.expandType == 1) {
        params = {
          "paramShareholderChainDepthMax": that.data.shareholderChainDepth,
          "paramShareholderEquityRatioMin": that.data.shareholderRatioMin/100,
          "paramShareholderEquityRatioMax": that.data.shareholderRatioMax/100,
        }
      } else if (that.data.expandType == 2) {
        params = {
          "paramInvesteeChainDepthMax": that.data.investeeChainDepth,
          "paramInvesteeEquityRatioMin": that.data.investeeRatioMin/100,
          "paramInvesteeEquityRatioMax": that.data.investeeRatioMax/100,
        }
      } else if (that.data.expandType == 4) {
        params = {
          "paramGeoDistanceKmMax": that.data.distanceMax,
          "paramGeoDistanceKmMin": that.data.distanceMin
        }
      }
   
      let matchParam = that.data.groupMatchParam;
      if (that.data.matchParamChange){
        requestParams.push(Object.assign({
          'type': 'extTypeEdit',
          'extType': that.data.expandType,
          'checked': false
        }))
      }

    // 判断是否进行了取消全选的操作
     if (that.data.select_none){
        requestParams.push(Object.assign({
          'type': 'extTypeEdit',
          'extType': that.data.expandType,
          'checked': false,
        }, params))
        // 保存全不选下勾选的企业
        this.data.companyList.forEach(item => {
          if (item['checked']) {
            requestParams.push({
              'type': 'singleMemberEdit',
              'checked': item.checked,
              'memberId': item['@id'] || item.id,
              'memberName': item.name,
              'extType': item.extType
            }) 
          }
        })
     }
    // 判断是否进行了全选的操作
    if (that.data.select_all) {
      requestParams.push(Object.assign({
        'type': 'extTypeEdit',
        'extType': that.data.expandType,
        'checked': true,
      }, params))
      // 保存全选下不勾选的企业 
      this.data.companyList.forEach(item => {
        if (!item['checked']) {
          requestParams.push({
            'type': 'singleMemberEdit',
            'checked': item.checked,
            'memberId': item['@id'] || item.id,
            'memberName': item.name,
            'extType': item.extType
          }) 
        }
      })
    }

   // 如果没有进行全选和全不选，只是操作单个企业时
    if (!that.data.select_none && !that.data.select_all){
        let arrBackup = that.data.companyListBackup
        let changeArr = this.data.companyList.filter((item, index) => {
          return item.checked != arrBackup[index].checked
        })

        changeArr.forEach(item => {
          requestParams.push({
            'type': 'singleMemberEdit',
            'checked': item.checked,
            'memberId': item['@id'] || item.id,
            'memberName': item.name,
            'extType': item.extType
          })
        })
    }

      

      that.postCompanyGroupEdit(requestParams)
      this.postDefaultAllocation();

      // if(this.data.select_all){ //  如果是全选保存 拓展关系的类型和参数 ，并保存不勾选的企业
      //   let noSelectMap = new HashMap();
      //   this.data.companyList.forEach(item => {
      //     if (item['disableCompany'] || !item['checked'] ){
      //       noSelectMap.put(item['@id'], item)
      //     }
      //   })
      //   app.globalData.expendRelationNoSelect  = Object.assign(app.globalData.expendRelationNoSelect, {
      //     [this.data.expandType]: noSelectMap
      //   }) 
      //   app.globalData.expendRelationSelectAll.push({
      //       'type': 'extTypeEdit',
      //       'extType' : this.data.expandType,
      //       'checked': true,
      //       'params': params,
      //   })
      // } else if(this.data.selectedList.length){ // 如果单选企业保存到本地
      //   let newList = this.data.selectedList || []
      //   let data = {
      //     "list": newList,
      //     "status": true
      //   }
      //   wx.setStorageSync('selfGroupData', data)
      // }
      // // 相同参数路径下 上次全选 ，然后不全选时全局拓展全选去除该类型
      // if (!this.data.select_all && this.data.isAlreadySelectAll) {
      //   let selectAll = app.globalData.expendRelationSelectAll
      //   selectAll.forEach(item => {
      //     if(item.extType == that.data.expandType
      //       && JSON.stringify(item.params) == JSON.stringify(params)){
      //       app.globalData.expendRelationSelectAll.pop(item)
      //       }
      //   })
      // }
      // // 全不选时，取消勾选所有企业
      // if (!this.data.select_all && this.data.editDisableFlag){
      //   let selectData = this.data.companyList.filter(item => {
      //       return item['checked']
      //   })
      //   app.globalData.expendRelationSelect = selectData
      //   app.globalData.expendRelationNoSelectAll.push({
      //     'type': 'extTypeEdit',
      //     'extType': this.data.expandType,
      //     'checked': false,
      //     'params': params,
      //   })
      // }
      // wx.showToast({
      //   title: '应用成功',
      // })
      // wx.navigateBack({
      //   delta: 2
      // })
  },
  postCompanyGroupEdit: function (params) {
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
      app.globalData.groupEditStatus = true
      app.globalData.expendEditStatus = true
      wx.showToast({
        title: '保存成功',
      })
      wx.navigateBack({
        delta: 2
      })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    })
  },
  showSlider: function(e){
    this.setData({
       sliderFlag: !this.data.sliderFlag,
       pickerFlag: false
    })
  },
  showPicker: function (e) {
    this.setData({
      sliderFlag: false,
      pickerFlag: !this.data.pickerFlag
    })
  },
  selectAllBtnChange: function(){
     let matchParams = this.data.groupMatchParam
     matchParams
  },
  // 缩短距离范围
  reduceDistance: function(){
    let that = this
    if (this.data.distanceMax > 0.0){
      that.setData({
        distanceMax: parseFloat((that.data.distanceMax - 0.1).toFixed(1))
      })
      clearTimeout(that.data.timer);
      that.data.timer = setTimeout(function () {
        that.setData({
          companyList: [],
          curPage:1,
          totalPage:0,
          selectedList:[],
          matchParamChange: false
        })
       // 拓展范围变小时默认全选
        if (that.data.groupMatchParam.paramGeoDistanceKmMax > that.data.distanceMax){
          that.setData({
            select_all:true,
            matchParamChange: true
          })
        }
        that.getCompanyList(that.data.coreInfo, true)
      }, 1000)
    }else{
      wx.showToast({
        title: '已达到最小值',
        icon: 'none',
        duration: 2000
      })
    }
  },
  // 增长距离范围
  increaseDistance: function(){
    let that = this
    if (this.data.distanceMax < 10) {
      that.setData({
        distanceMax: parseFloat((0.1 + that.data.distanceMax).toFixed(1))
      })
      clearTimeout(that.data.timer);
      that.data.timer = setTimeout(function () {
        that.setData({
          companyList: [],
          curPage: 1,
          totalPage: 0,
          selectedList: [],
          matchParamChange: false
        })
        // 拓展范围变小时默认全选
        if (that.data.groupMatchParam.paramGeoDistanceKmMax > that.data.distanceMax) {
          that.setData({
            select_all: true,
            matchParamChange: true
          })
        }
        that.getCompanyList(that.data.coreInfo, true)
      }, 1000)
    } else {
      wx.showToast({
        title: '已达到最大值',
        icon: 'none',
        duration: 2000
      })
    } 
  },
  // 选择穿透层数
  selectLayer: function(e){
    let index = e.currentTarget.dataset.index
    if (this.data.currentIndex == index){
      return
    }
    let matchParams = this.data.groupMatchParam
    if(this.data.expandType == 1){
      this.setData({
        shareholderChainDepth: index + 1,
        matchParamChange: false
      })
      // 拓展范围变小时默认全选
      if (matchParams.paramShareholderChainDepthMax > this.data.shareholderChainDepth) {
        this.setData({
          select_all: true,
          matchParamChange: true
        })
      }
    } else if (this.data.expandType == 2){
      this.setData({
        investeeChainDepth: index + 1,
        matchParamChange: false
      })
      // 拓展范围变小时默认全选
      if (matchParams.paramInvesteeChainDepthMax > this.data.investeeChainDepth) {
        this.setData({
          select_all: true,
          matchParamChange: true
        })
      }
    }
    this.setData({
      currentIndex: index,
      pickerFlag: false,
      companyList: [],
      curPage: 1,
      totalPage: 0,
      selectedList: []
    })

    this.getCompanyList(this.data.coreInfo, true)
  },
  setShareholdingRatio: function(){
    let matchParams = this.data.groupMatchParam
    if (this.data.sliderFlag && this.data.expandType == 1) {
      this.setData({
        shareholderRatioMin: this.data.minValue,
        shareholderRatioMax: this.data.maxValue,
        matchParamChange: false
      })
      // 拓展范围变小时默认全选
      if (matchParams.paramShareholderEquityRatioMin > this.data.shareholderRatioMin
        || matchParams.paramShareholderEquityRatioMax > this.data.shareholderRatioMax) {
        this.setData({
          select_all: true,
          matchParamChange: true
        })
      }
    } else if (this.data.sliderFlag && this.data.expandType == 2) {
      this.setData({
        investeeRatioMin: this.data.minValue,
        investeeRatioMax: this.data.maxValue,
        matchParamChange: false
      })
      // 拓展范围变小时默认全选
      if (matchParams.paramInvesteeEquityRatioMin > this.data.investeeRatioMin
        || matchParams.paramInvesteeEquityRatioMax > this.data.investeeRatioMax) {
        this.setData({
          select_all: true,
          matchParamChange: true
        })
      }
    }
    this.setData({
      sliderFlag: false,
      companyList: [],
      curPage: 1,
      totalPage: 0,
      selectedList: []
    })
    this.getCompanyList(this.data.coreInfo, true)
  },
  closeMask: function(e){
    this.setData({
      sliderFlag: false,
      pickerFlag: false
    })
  },
  
  // 选择
  select: function (e) {
    var that = this;
    let disable = e.currentTarget.dataset.disable;
    if (disable) {
      wx.showToast({
        title: '该企业已返回，无需再次添加',
        icon: 'none',
        duration: 2000
      })
      return
    }
    let arr2 = [];
    var arr = that.data.companyList;
    var index = e.currentTarget.dataset.index;
    arr[index].checked = !arr[index].checked;
    let number = arr[index].checked ? that.data.selectedNumber + 1 : that.data.selectedNumber - 1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr2.push(arr[i])
      }
    };
    that.setData({
      companyList: arr,
      selectedList: arr2,
      selectedNumber: number
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
        // if (arr[i].disableCompany) arr[i].disableCompany = false
      }
      that.setData({
        companyList: arr2,
        selectedList: arr2,
        selectedNumber: that.data.resultsTotal,
        select_none: false,
        editSelectAll: true,
        editSelectNone: false
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
    let arr2 = [], selectArr = [];
    for (let i = 0; i < arr.length; i++) {
      arr[i].checked = false;
      // if (!arr[i].disableCompany) {
      //   selectArr.push(arr[i])
      // }
      arr2.push(arr[i]);
    }
    that.setData({
      companyList: arr2,
      selectedList: [],
      selectedNumber: 0,
      select_none: true,
      editSelectAll: false,
      editSelectNone: true
    })
  },
  // 下拉加载分页
  onReachBottom: function () {
    var curPage = this.data.curPage;
    var totalPage = this.data.totalPage + 1;
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
      isLoading: false,
      companyLoading: true,
      curPage: curPage
    })
    this.getCompanyList(this.data.coreInfo)
  },
  onRangeChange: function (e) {
    this.setData({
      minValue: Math.round(e.detail.minValue),
      maxValue: Math.round(e.detail.maxValue)
    });

  },
  onTest: function () {
    this.setData({
      rangeValues: [300, 600]
    });
  },
  bindPickerChange: function (e) {
    this.setData({
      index: e.detail.value
    })
  },
  // 跳转实控路径页面
  toControlledPage: function (e) {
    let index = e.currentTarget.dataset.index;
    let type = e.currentTarget.dataset.type;
    let data = this.data.companyList[index]
    // 股东关系实控路径中，核心企业为被投资方; 股东关系实控路径中，核心企业为投资方
    let end = {
      name: type == 1 ? data.extType[this.data.expandType].nameCompany : data.name,
      id: type == 1 ? data.extType[this.data.expandType].idCompany : data['@id']
    }
    let begin = {
      name: type == 1 ? data.name : data.extType[this.data.expandType].nameCompany ,
      id: type == 1 ?  data['@id'] : data.extType[this.data.expandType].idCompany
    }
    getApp().router.navigateTo({
      url: '../controlledPath/controlledPath?type=self&begin=' + JSON.stringify(begin) + '&end=' + JSON.stringify(end)
    })
  },
  // 跳转工商详情页面
  toDetailPage: function (e) {
    var that = this;
    let name = e.currentTarget.dataset.name
    let disable = e.currentTarget.dataset.person
    if (!name || disable) { // 如果是人物则不跳转工商详情页
      return
    }
    getApp().router.navigateTo({
      url: '../detail/detail?name=' + name
    })
  },
  backSettingPage: function () {
    getApp().router.navigateTo({
      url: '../characterGroupSetting/characterGroupSetting'
    })
  }
})