// pages/setname/setname.js
var get_user_info = require('../../dist/user.js').get_user_info;

const app = getApp();
const g_data = app.globalData;

Page({
  data: {
    focus: true,
  },
  focusInput: function () {
    this.setData({
      focus: true,
    });
  },
  getInput: function (e) {
    this.setData({
      input_value: e.detail.value.replace(/(^\s*)|(\s*$)/g, ""),
    });
  },
  blurInput: function () {
    this.setData({
      focus: false,
    });
  },
  clearInput: function () {
    this.setData({
      input_value: '',
    });
  },
  setName: function() {
    var self = this;
    var new_name = self.data.input_value;
    if (!new_name || new_name === self.data.old_name) { //输入为空或未做修改
      wx.navigateBack({
        delta: 1,
      });
      return;
    }

    wx.showLoading('正在修改');
    var device_id = self.data.device_id;
    get_user_info(function (user) {
      if (user) {
        var dev = {
          "name": new_name,
        };
        wx.request({
          url: g_data.public_url + "/devices/" + device_id +"?access_token=" + user.accessToken,
          data: dev,
          method: "PUT",
          success: function (res) {
            if (res.statusCode === 200) {
              wx.showToast({
                title: '修改成功',
              });
              var pages = getCurrentPages();
              var page_device_info = pages[pages.length - 2]; //上一个页面
              var page_history = pages[pages.length - 3];
              var page_index = pages[pages.length - 4];

              var device_info = page_device_info.data.basic_info;
              var history_info = page_history.data.basic_info;
              var name_of_index = page_index.data.checked_name;

              device_info.name = new_name;
              history_info.name = new_name;
              name_of_index = new_name;
              g_data.edited_device = {
                device_id: device_id,
                name: new_name,
              };
              page_device_info.setData({
                basic_info: device_info,
              });
              page_history.setData({
                basic_info: history_info,
              });
              page_index.setData({
                checked_name: name_of_index,
              });
              wx.navigateBack({
                delta: 1,
              });
            } else {
              app.showModal('修改失败', JSON.stringify(res.data.message));
            }
          }, fail: function (err) {
            app.showModal('修改失败', '请检查你的网络设置');
          },
          complete: function () {
            wx.hideLoading();
          },
        });
      }
    });
  },
  onLoad: function (options) {
    var old_name = decodeURIComponent(options.name);
    this.setData({
      device_id: options.device_id,
      old_name: old_name,
      input_value: old_name,
    });
  },
  onShow: function () {

  },
})