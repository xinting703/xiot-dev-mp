// pages/deviceinfo/deviceinfo.js
const get_user_info = require('../../dist/user.js').get_user_info;

const app = getApp();
const g_data = app.globalData;
const TABLE = [
  0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823, 0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70, 0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067, 0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d, 0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a, 0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
];
const crc16_ccitt = function (str) {
  let crc = 0xffff;
  for (let index = 0; index < str.length; index++) {
    let byte = str.charCodeAt(index);
    crc = (TABLE[(crc >> 8 ^ byte) & 0xff] ^ (crc << 8)) & 0xffff;
  }
  return (~crc) & 0xffff;
};

Page({
  data: {
    is_owner: false,
  },
  /**获取基本信息 */
  get_basic_info: function (device_id) {
    let self = this;
    wx.showLoading({
      title: '正在加载',
    });
    get_user_info(function (user) {
      if (user) {
        wx.request({ //获取设备信息
          url: g_data.public_url + '/devices/' + device_id + "?access_token=" + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) { //成功
              let cur_dev = res.data.device;
              self.setData({
                is_owner: cur_dev.is_owner,
                basic_info: {
                  device_id: cur_dev.device_id,
                  type_id: cur_dev.type_id,
                  model_id: cur_dev.model_id,
                  name: cur_dev.name || '--',
                  sn: cur_dev.sn,
                  model_name: cur_dev.model_name,
                  version: cur_dev.software ? cur_dev.software.version : '--',
                  is_public: cur_dev.access_control && cur_dev.access_control === 'public' ? true : false,
                },
              });
            } else {
              app.showModal('获取失败', JSON.stringify(data.message));
            }
          },
          fail: function(err) {
            app.showModal('获取失败', JSON.stringify(err));
          },
          complete: function() {
            wx.hideLoading();
          },
        });
      }
    });
  },
  /**修改设备名 */
  setName: function() {
    let device = this.data.basic_info;
    wx.navigateTo({
      url: '../setname/setname?device_id=' + device.device_id + '&name=' + encodeURIComponent(device.name),
    });
  },
  /** 查看二维码 */
  checkQrcode: function () {
    let self = this;
    let device = self.data.basic_info;
    let qrcode_text = 'device,' + device.type_id + ',' + device.model_id + ',' + device.device_id + ',';
    qrcode_text += crc16_ccitt(qrcode_text + '9641c8e0a48811e6a750d575346e4606').toString(16);
    wx.navigateTo({
      url: '../qrcode/qrcode?qrcode_text=' + qrcode_text + '&is_owner=' + self.data.is_owner,
    });
  },
  /**设置共享 */
  switchChange: function (e) { //共享
    var self = this;
    var device = self.data.basic_info;
    var device_id = device.device_id;
    var checked = e.detail.value;
    get_user_info(function (user) {
      if (user) {
        var dev = {
          "access_control": checked ? 'public' : 'private',
        };
        wx.request({
          url: g_data.public_url + "/devices/" + device_id + "?access_token=" + user.accessToken,
          data: dev,
          method: "PUT",
          success: function (res) {
            if (res.statusCode === 200) {
              wx.showToast({
                title: '修改成功',
              });
            } else {
              wx.showModal({
                title: '修改失败',
                content: '请稍后再试',
                showCancel: false,
                complete: function () {
                  device.public = !checked;
                  self.setData({
                    basic_info: device
                  });
                }
              });
            }
          }, fail: function () {
            wx.showModal({
              title: '修改失败',
              content: '请稍后再试',
              showCancel: false,
              complete: function () {
                device.public = !checked;
                self.setData({
                  basic_info: device
                });
              }
            });
          }
        });
      }
    });
  },
  /**添加设备 */
  addDevice: function (e) {
    let self = this;
    wx.showLoading({
      title: '正在添加',
    });
    get_user_info(function (user) {
      if (user) {
        wx.request({
          url: g_data.public_url + "/devices?access_token=" + user.accessToken,
          method: "POST",
          data: {
            device_id: e.target.dataset.deviceid,
          },
          success: function (res) {
            wx.hideLoading(); //晚关闭会影响success的显示
            if (res.statusCode === 201) { //添加成功
              app.showSuccess('添加成功');
              self.reget_devices();
            } else {
              app.showModal('添加失败', '请稍后再试');
            }
          },
          fail: function (err) {
            wx.hideLoading();
            app.showModal('添加失败', '请检查你的网络设置');
          },
        });
      }
    });
  },
  /**删除设备 */
  deleteDevice: function(e) {
    let self = this;
    wx.showModal({
      title: '提示',
      content: '确认取消关注？',
      showCancel: true,
      success: function (res) {
        if (res.confirm) { //用户点击确定
          // wx.showLoading({
          //   title: '正在删除',
          // });
          get_user_info(function (user) {
            if (user) {
              wx.request({
                url: g_data.public_url + "/devices/" + e.currentTarget.dataset.deviceid +"?access_token=" + user.accessToken,
                method: "DELETE",
                success: function (res) {
                  wx.hideLoading();
                  if (res.statusCode === 204) { //删除成功
                    app.showSuccess('取消成功');
                    self.reget_devices();
                    g_data.deleted_id = e.currentTarget.dataset.deviceid;
                  } else {
                    app.showModal('取消失败', JSON.stringify(res.data.message));
                  }
                },
                fail: function (err) {
                  // wx.hideLoading();
                  app.showModal('取消失败', '请检查你的网络设置');
                },
              });
            }
          });
        }
      },
    });
  },
  /**重新获取全部设备 */
  reget_devices: function() {
    get_user_info(function (user) {
      if (user) {
        wx.request({ //获取全部设备
          url: g_data.public_url + "/devices?count=" + g_data.dev_per_count + "&offset=0&access_token=" + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) {
              g_data.devices_new = res.data.devices;
            }
          },
          complete: function () {
            app.delay_back(2, 500);
          },
        });
      }
    });
  },
  onLoad: function (options) {
    this.get_basic_info(options.device_id);
    for (var i = 0; i < g_data.devices.length; ++i) {
      if (g_data.devices[i].device_id === options.device_id) { //已经存在该设备
        this.setData({
          is_added: true,
        });
      }
    }
    this.setData({
      show_detail: options.source && options.source === 'add' ? false : true,
    });
  },
  onReady: function () {
  },
  onShow: function () {
  },
})