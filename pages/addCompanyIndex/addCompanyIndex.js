// pages/addCompany/addCompany.js 人物中心 - 新建企业搜索页面
Page({ 
  data: {
    companyValue:'',
    companyFocus: false,
    inputCompanyFlag: false,
    personValue: '',
    personFocus: false,
    inputPersonFlag: false,
  },
  onLoad: function (options) {

  },
  focusCompany: function () {
    this.setData({
      companyFocus: false
    })
    getApp().router.navigateTo({
      url: '../addCompanyDetail/addCompanyDetail?type=Company'
    })
  },
  focusPerson: function () {
    this.setData({
      personFocus: false
    })
    getApp().router.navigateTo({
      url: '../addCompanyDetail/addCompanyDetail?type=Person' 
    })
  },
  searchCompany: function () {
    getApp().router.navigateTo({
      url: '../addCompanyDetail/addCompanyDetail?type=1&companyName=' + this.data.companyValue
    })
  },
  searchPerson: function(value){
    getApp().router.navigateTo({
      url: '../addCompanyDetail/addCompanyDetail?type=2&personName=' + this.data.personValue
    })
  },
  inputCompany: function (e) {
    var prefix = e.detail.value
    this.setData({
      companyValue: prefix
    })
  },
  confirmCompany: function () {
    if (!this.data.companyValue) {
      return
    }
    this.searchCompany()
  },
  inputPerson: function (e) {
    var prefix = e.detail.value
    this.setData({
      personValue: prefix
    })
  },
  confirmPerson: function () {
    if (!this.data.personValue) {
      return
    }
    this.searchPerson()
  },
  // 清空输入框的内容
  deleteCompany: function () {
    let that = this
    that.setData({
      companyValue: '',
      inputCompanyFlag: false
    })
  },
  deletePerson: function () {
    let that = this
    that.setData({
      personValue: '',
      inputPersonFlag: false
    })
  },
})