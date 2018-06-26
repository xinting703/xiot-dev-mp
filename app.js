
App({
  onLaunch: function () {
    var self = this;
    wx.getSystemInfo({ //获取设备高度
      success: function (res) {
        self.globalData.screenWidth = res.windowWidth || res.screenWidth;
        self.globalData.screenHeight = res.windowHeight || res.screenHeight;
        self.globalData.px_scale = self.globalData.screenWidth / 750;
      }
    });
  },
  showTip: function (t) {
    wx.showToast({
      title: t,
      duration: 10000,
      mask: true //显示透明蒙层，防止触摸穿透
    });
  },
  showSuccess: function (t) {
    wx.showToast({
      title: t,
      icon: 'success',
      duration: 1500
    });
  },
  showModal: function (title, content) {
    wx.showModal({
      title: title ? title : '',
      content: content,
      showCancel: false,
      confirmColor: "#09c264"
    });
  },
  /**延迟返回上级页面 */
  delay_back: function(delta, time) {
    setTimeout(function() {
      wx.navigateBack({
        delta: delta || 1,
      });
    }, time || 200);
  },
  /**格式化小数的显示 */
  format_number: function (num) {
    var result = Number(num).toFixed(1).split('.'); //拆分成整数与小数
    if (result[1] === '0') { //小数部分为0
      result = result[0];
    } else {
      result = result[0] + '.' + result[1];
    }
    return result;
  },
  /*转换信号强度*/
  get_icon_signal: function (RSSI) {
    if (RSSI >= -65) {
      return '/images/common/icon_signal4@2x.png';
    } else if (RSSI >= -75) {
      return '/images/common/icon_signal3@2x.png';
    } else if (RSSI >= -88) {
      return '/images/common/icon_signal2@2x.png';
    } else if (RSSI >= -105) {
      return '/images/common/icon_signal1@2x.png';
    } else {
      return '/images/common/icon_signal0@2x.png';
    }
  },
  /*转换电池电量*/
  get_battery_color: function (battery_level) {
    if (battery_level >= 75) {
      return '#75ca85';
    } else if (battery_level >= 50) {
      return '#f1a63b';
    } else if (battery_level >= 25) {
      return '#f1415a';
    } else {
      return '#ff0000';
    }
  },
  globalData: {
    public_url: 'https://iot.xaircraft.com/test/fm/api/v1',
    dev_per_count: 44, //单次加载设备的数量
    userInfo: null,
    photo_ratio: 3456 / 4608, //照片比例
    thumbnail: 5, //缩略图比例
    mnc2name: {
      460: {
        0: "中国移动",
        1: "中国联通",
        2: "中国移动",
        3: "中国电信",
        5: "中国电信",
        6: "中国联通",
        7: "中国移动",
        11: "中国电信",
        20: "中国铁通"
      },
      505: {
        1: "Telstra",
        2: " Optus",
        3: " Vodafone",
        8: "One.Tel",
      }
    },
  }
})