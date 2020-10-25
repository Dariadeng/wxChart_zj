// pages/warningEvent/warningEvent.js
import { get_api_url, get_api_user } from '../../utils/config.js'
import { httpRequest } from '../../utils/httpUtil.js'
import { numFormat, HashMap, formatDate} from '../../utils/util.js'

Page({
  data: {
    isLoad: true,
    isNoData: false,
    historyNodata: false,
    caseList:[],
    todayEvents:[],
    historyEvents:[]
  },
  onLoad: function (options) {
    this.getEventList()
  },
  getEventList: function () {
    let that = this
    httpRequest({
      url: get_api_user + '/events',
      data: {
        // page: 0,
        // size: 10
      },
      method: 'GET'
    }).then((res) => {
      let results = res.content;
      if (results) {
        let todayList = [], historyList = [];
        let infoData = {}, winLose = '';
        results.forEach(function (objItem) {
          let com_name = ''
          objItem.contextLinks.forEach(function (item) {
            // // 过滤返回的公司不是 请求的公司id集合 中的案件
            infoData = JSON.parse(JSON.stringify(that.getCaseInfo(item.in['@id'], objItem.mainEntity)));
            if (item.nameWinLose === '胜诉方') {
              winLose = '胜诉收款'
            } else if (item.nameWinLose === '败诉方') {
              winLose = '败诉赔款'
            } else {
              winLose = item.nameWinLose
            }
            let creditValue = ''
            if (item.sumOfPaymentCredit && item.sumOfPaymentCredit.text) {
              creditValue = numFormat(item.sumOfPaymentCredit.value)
            }
            let data = Object.assign(infoData, {
              comName: item.out.name,
              name: item.name,
              outId: item.out['@id'],
              nameWinLose: item.nameWinLose && item.nameWinLose.slice(0, 2),
              winLoseCredit: winLose + creditValue
            })
            let curDate = formatDate();

            let dateModified = objItem.mainEntity.dateModified && objItem.mainEntity.dateModified.trim().split(" ")[0]
            if (curDate == dateModified){
                todayList.push(data);
            }else{
                historyList.push(data)
            }
          })
        })
        that.setData({
          isLoad: false,
          isNoData: false,
          todayEvents: todayList,
          historyEvents: historyList,
          todayNodata: !todayList.length,
          historyNodata: !historyList.length
        })
      } else {
        that.setData({
          isLoad: false,
          isNoData: true
        })
      }
    }).catch((errMsg) => {
      console.log(errMsg);//错误提示信息
    });
  },
  getCaseInfo: function (id, data) {
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
    return obj
  },
  toCaseDetailPage: function(e){
      let data = this.data.caseList.filter((item) => {
        return item['@id'] === e.currentTarget.id
      })
      wx.navigateTo({
        url: '../caseDetail/caseDetail?data=' + JSON.stringify(data)
      })
  } 
})