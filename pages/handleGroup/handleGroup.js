// pages/handleMonitor/handleMonitor.js -企业监控的处理  增删改查
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat, HashMap } from '../../utils/util.js'
const getInf = (str, key) => str.replace(new RegExp(`${key}`, 'g'), `%%${key}%%`).split('%%');

Page({
  data: {
    inputValue:'',
    inputFlag:false,
    list:[],
    showRecord: true,
    companyList: [],
    groupList:[],
    historyData: [],
    isLoad: true,
    isNoData: false,
    isFirstLoad: true,
    coreId: '' 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
     this.setData({
        coreId: options && options.coreId
     })
     this.getRecordData();
  },
  closeRecord: function(){
     this.setData({
         showRecord: false,
     })
  },
  cancleSearch: function(){
    if (!this.data.isNoData && this.data.inputValue){
      this.getRecordData()
    }else{
      this.setData({
        showRecord: true,
        isNoData: false,
      })
    }
  },
  toBusinessPage: function(e){ // 跳转到工商信息页
    let name = e.currentTarget.dataset.name
    wx.navigateTo({
      url: '../detail/detail?name=' + name
    })
  },
  toHistoryPage: function(){
    this.setData({
      isFirstLoad: false
    })
    wx.navigateTo({
      url: '../groupHistory/groupHistory?coreId=' + this.data.coreId
    })
  },
  bindinput: function (e) {
      this.setData({
        inputValue: e.detail.value,
        inputFlag: true
      })
  },
  bindconfirm: function (e) {
      this.setData({
        inputValue: e.detail.value,
        inputFlag: true
      })
      this.getSearchCompany(e.detail.value)
  },
  bindDelete: function(){
    let that = this
    that.setData({
      inputValue: '',
      inputFlag: false
    })
  },
  // 获取最近添加（历史记录）
  getRecordData: function () {
    let that = this
    httpRequest({
      url: get_api_user + '/companyGroupMemberPatches/search',
      data: {
        "actions": ["ADD"],
        "companyIds": [],
        "coreCompanyId": that.data.coreId
      },
      method: 'POST'
    }).then((res) => {
      let results = res
      if (results && results.length) {
        results.forEach(item => {
          item['createDate'] = item.createAt && item.createAt.trim().split(" ")[0]
        })
        that.setData({
          showRecord:true,
          historyData: results
        })
      } else {
        that.setData({
          showRecord:true,
          historyData: []
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  // 搜索公司
  getSearchCompany: function(){
    let that = this
    let name = that.data.inputValue
    let payload = {
      "query": name
    }
    that.setData({
      companyList: []
    })
    wx.request({
      url: get_api_url + '/entities/search',
      method: 'POST',
      data: payload,
      header: {
        "x-api-key": '1M4YwhFYTgybxTgCMo3y2AgaVl1JHYw2mVK4ubkh'
      },
      success: function (res) {
        let idArr = []
        let results = res.data.result && res.data.result.itemListElement
        if (results && results.length) {
          results.forEach(item => {
            idArr.push(item.result['@id'])
            item.result['comName'] = getInf(item.result.name, name)  
            item.result.saicRegistrationStatus = item.result.saicRegistrationStatus.replace(/\（.*?\）/g, '')   
            if (item.result.saicRegistrationCapital.value) {
              item.result.saicRegistrationCapital.value = numFormat(item.result.saicRegistrationCapital.value)
            } else {
              item.result.saicRegistrationCapital.value = '未公开'
            }
          })
          //that.getAddInfo(idArr, that.data.coreId)
          that.setData({
            showRecord: false,
            isLoad: false,
            list: results,
            companyList: results,
            isNoData: false
          })
        }else {
          that.setData({
            showRecord: false,
            isLoad: false,
            isNoData: true
          })
        }
        // wx.hideLoading()
      }
    })

  },
  // 搜索公司后请求接口判断是否为添加状态？
  getAddInfo: function(comIdArr,coreId){
     let that = this
     httpRequest({
      url: get_api_user + '/companyGroupMemberPatches/search',
      data: {
        "actions": ["ADD"],
        "companyIds": comIdArr,
        "coreCompanyId": coreId  
      },
      method: 'POST'
    }).then((res) => {
      let addData = res
      // let groupData = that.data.groupList
      // let companyMap = new HashMap();
      // groupData.forEach((item) => {
      //   companyMap.put(item.company_id, item)
      // }) 
      let comList = that.data.list
      // 判断该公司是否被添加
      comList && comList.forEach(item => {
        if (addData && addData.length) {
          addData.forEach(addItem => {
            item.result['addId'] = addItem.id
            item.result['isAdd'] = addItem.companyId === item.result['@id']
          })
        } else {
          item.result['isAdd'] = false
        }
      })
      // 判断该公司是否在集团公司中存在，存在则不能再次添加
      // comList && comList.forEach(cItem => {
      //   if (groupData.length && companyMap.get(cItem.result['@id'])) {
      //       cItem.result['isInclude'] = true
      //   } else {
      //       cItem.result['isInclude'] = false
      //   }
      // })
      that.setData({
        isLoad: false,
        companyList: comList,
      })
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  bindAddGroupMenber: function(e){ // 添加到企业集团
    let that = this
    let index = e.currentTarget.dataset.index;
    let comList = that.data.companyList
    comList.forEach((item,i)=>{
       if(i === index){
         httpRequest({
           url: get_api_user + '/companyGroupMemberPatches',
           data: {
             "action": "ADD",
             "companyGroupId": that.data.coreId,
             "companyId": item.result['@id'],
             "attributes": {
               "name": item.result.name
             }
           },
           method: 'POST'
         }).then((res) => {
           item.result.isAdd = true
           item.result['addId'] = res.id
           wx.showToast({
             title: '添加成功',
             icon: 'success',
             duration: 3000
           });
           that.setData({
             companyList: comList
           })
         }).catch((errMsg) => {
           console.log(errMsg);//错误提示信息
         }); 
       }
    })

  },
  // 删除历史记录中已添加的企业
  bindDeleteGroupMember: function (e) {  
      let that = this
      httpRequest({
        url: get_api_user + '/companyGroupMemberPatches/' + e.target.id,
        method: 'DELETE'
      }).then((res) => {
        that.getRecordData()      
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 3000
        });
      }).catch((errMsg) => {
        console.log(errMsg);//错误提示信息
      }); 
  },
  bindCancelGroupMenber: function (e) { // 取消添加企业
    let that = this
    let index = e.currentTarget.dataset.index;
    let comList = that.data.companyList
    comList.forEach((item, i) => {
      if (i === index) {
          httpRequest({
            url: get_api_user + '/companyGroupMemberPatches/' + item.result.addId,
            data: {
              // "companyGroupMemberPatchId": item.result.addId
            },
            method: 'DELETE'
          }).then((res) => {
            item.result.isAdd = false
            wx.showToast({
              title: '取消成功',
              icon: 'success',
              duration: 3000
            });
            that.setData({
              companyList: comList
            })
          }).catch((errMsg) => {
            console.log(errMsg);//错误提示信息
          });
      }
    })
  },
  onShow: function () {
     !this.data.isFirstLoad && this.getRecordData()
  },
})