// pages/inputnumber/inputnumber.js
var get_user_info = require('../../dist/user.js').get_user_info;

var app = getApp();
var g_data = app.globalData;

Page({
  data: {
    input_value: '',
  },
  focusInput: function () {
    this.setData({
      show_clear: true,
    });
  },
  getInput: function (e) {
    this.setData({
      input_value: e.detail.value.replace(/(^\s*)|(\s*$)/g, ""),
    });
  },
  blurInput: function () {
    this.setData({
      show_clear: false,
    });
  },
  clearInput: function () {
    this.setData({
      input_value: '',
    });
  },
  /**点击确定添加设备 */
  confirmAddDevice: function () { //添加设备确认
    var that = this;
    var existing_devices = g_data.devices;
    var device_id = that.data.input_value;
    if (!device_id) { //输入为空
      wx.navigateBack({ //返回设备页
        delta: 1,
      });
      return;
    }

    for (var i = 0; i < existing_devices.length; ++i) {
      if (existing_devices[i].device_id === device_id) { //分组中存在相同设备
        wx.showToast({
          title: '添加成功',
        });
        app.delay_back();
        return;
      }
    }
    that.addDevice(device_id);
  },
  addDevice: function (device_id) { //添加设备操作
    var that = this;
    wx.showLoading({
      title: '正在添加',
    });
    get_user_info(function (user) {
      if (user) {
        wx.request({
          url: g_data.public_url + "/devices?access_token=" + user.accessToken,
          method: "POST",
          data: {
            device_id: device_id
          },
          success: function (res) {
            if (res.statusCode === 201) { //添加成功
              that.reget_devices();
            } else { //添加失败
              app.showModal('添加失败', res.data.message);
            }
          }, fail: function (err) { //添加失败
            app.showModal('添加失败', '请检查你的网路设置');
          },
          complete: function (res) {
            wx.hideLoading();
            if (res.statusCode === 201) {
              app.showSuccess('添加成功');
            }
          }
        }); //加入分组调用结束
      }
    });
  },
  /**重新获取全部设备 */
  reget_devices: function () {
    get_user_info(function (user) {
      if (user) {
        wx.request({ //获取全部设备
          url: g_data.public_url + "/devices?count="+g_data.dev_per_count+"&offset=0&access_token=" + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) {
              g_data.devices_new = res.data.devices;
            }
          },
          complete: function () {
            app.delay_back(2);
          },
        });
      }
    });
  },
  onLoad: function (options) {
    
  },
  onShow: function () {
  
  },
  onUnload: function() {
    
  }
})