// pages/index/index.js
var get_user_info = require('../../dist/user.js').get_user_info;
var moment = require('../../dist/moment.min.js');
var util = require('../../dist/zh-cn.js');  //任意一个地方引入即可

var app = getApp();
var g_data = app.globalData;
var loaded = false; //此页面为第一个页面，loaded可以定义为全局变量，实则只使用一次
var photo_width = 0; //图片宽度（基准值，用于计算高度）

let start_x = 0, start_y = 0;

Page({
  data: {
    x: 0,
    y: 0,
    out_of_network: false,
    mode_is_visible: false,
    lazy: true,
  },
  /**格式化页面列表显示 */
  do_show_devices: function() {
    var self = this;
    if(loaded) {
      var origin_devices = g_data.devices;
      var devices_onshow = [];
      for (var i = 0; i < origin_devices.length; ++i) {
        var cur_dev = origin_devices[i];
        var operator = cur_dev.network && cur_dev.network.cell && g_data.mnc2name[cur_dev.network.cell.mcc]  && g_data.mnc2name[cur_dev.network.cell.mcc][cur_dev.network.cell.mnc] ? g_data.mnc2name[cur_dev.network.cell.mcc][cur_dev.network.cell.mnc] : '未知运营商';
        let photo = {
          src: '',
          ratio: g_data.photo_ratio,
          height: g_data.photo_ratio * photo_width, // 100% * H/W
        };
        
        if (cur_dev.datapoints && cur_dev.datapoints.length) {
          for (let j = 0; j < cur_dev.datapoints.length; ++j) { //type可能多种，例如photo，weather等
            let cur_datapoint = cur_dev.datapoints[j];
            if (cur_datapoint.type === 'photo' && cur_datapoint.data) {
              let src = cur_datapoint.data.url + '?x-oss-process=image/resize,w_' + Math.ceil(cur_datapoint.data.width / 5);
              let height = cur_datapoint.data.height / cur_datapoint.data.width * photo_width; // 100% * H/W
              let created_at = cur_datapoint.created_at;
              let interval = moment().diff(moment(1000 * created_at), 'seconds');
              if (interval < 60) { //1分钟内
                interval = '刚刚';
              } else {
                interval = moment().diff(moment(1000 * created_at), 'days');
                interval = interval ? (interval + '天') : moment(1000 * created_at).fromNow(true);
                interval += '前';
              }
              photo = {
                src: src,
                ratio: cur_datapoint.data.height / cur_datapoint.data.width,
                height: height,
                created_at: created_at,
                interval: interval,
              };
            }
          }
        }
        devices_onshow.push({
          is_owner: cur_dev.is_owner,
          device_id: cur_dev.device_id,
          status: cur_dev.status,
          name: cur_dev.name || '--',
          icon_signal: cur_dev.network ? app.get_icon_signal(cur_dev.network.RSSI) : '',
          operator: operator,
          battery_level: cur_dev.battery.level <= 100 ? (cur_dev.battery.level + '%') : '',
          battery_color: app.get_battery_color(cur_dev.battery.level),
          charging: cur_dev.battery.charging,
          photo: photo,
          watch_count: cur_dev.watch_count,
        });
      }
      self.setData({
        devices_onshow: devices_onshow,
        no_device: !devices_onshow.length,
      });
    }
  },
  /**获取设备列表 */
  loadDevices: function (refresh) {
    var self = this;
    if (!refresh) {
      wx.showLoading({
        title: '正在加载',
      });
    }
    let is_success = false;
    get_user_info(function (user) {
      if (user) {
        wx.request({ //获取全部设备
          url: g_data.public_url + "/devices?count=" + g_data.dev_per_count+"&offset=0&access_token=" + user.accessToken,
          method: "GET",
          success: function (res) {
            loaded = true;
            if (res.statusCode === 200) {
              is_success = true; //获取成功
              g_data.devices = res.data.devices;
              self.do_show_devices();
            } else {
              app.showModal('加载失败', res.data.message)
            }
          },
          fail: function (err) {
            self.setFailInfo();
          },
          complete: function (res) {
            wx.hideLoading();
            if(refresh) {
              wx.stopPullDownRefresh();
              if (is_success) {
                app.showSuccess('数据更新成功');
              }
            }
          },
        });
      }
    });
  },
  /**显示或隐藏添加模式 */
  showMode: function() {
    this.setData({
      mode_is_visible: !this.data.mode_is_visible,
    });
  },
  /**移动悬浮按钮 */
  moveStart: function (e) {
    start_x = e.touches[0].clientX;
    start_y = e.touches[0].clientY;
  },
  moveIng: function (e) {
    let current_x = e.touches[0].clientX || e.changedTouches[0].clientX; //当前位置
    let current_y = e.touches[0].clientY || e.changedTouches[0].clientY;
    let delta_x = current_x - start_x; //经过的距离
    let delta_y = current_y - start_y;
    start_x = e.touches[0].clientX; //更新每一次的起点
    start_y = e.touches[0].clientY;

    let self = this;
    let final_x = self.data.floating_right - delta_x / g_data.px_scale; //最终位置
    let final_y = self.data.floating_bottom - delta_y / g_data.px_scale;
    if (final_x < 20) {
      final_x = 20;
    } else if (final_x > g_data.screenWidth / g_data.px_scale - 120 - 20) {
      final_x = g_data.screenWidth / g_data.px_scale - 120 - 20;
    }
    let top_blank = 20 + 280 + 90; //顶部留给弹出模式的空白（280为上面小按钮距离主按钮底部的距离）
    if (final_y < 120) {
      final_y = 120;
    } else if (final_y > g_data.screenHeight / g_data.px_scale - top_blank) {
      final_y = g_data.screenHeight / g_data.px_scale - top_blank;
    }
    self.setData({
      floating_bottom: final_y,
      // floating_right: final_x,
    });
  },
  moveEnd: function (e) {
    let self = this;
    self.setData({
      floating_bottom: self.data.floating_bottom,
      // floating_right: (self.data.floating_right + 120 * 0.5) * g_data.px_scale > g_data.screenWidth / 2 ? g_data.screenWidth / g_data.px_scale - 120 - 20 : 20, //right定位，与常规left判断（小于一半为左，大于为右）相反，以按钮中心点为基准（120*0.5）
    });
  },
  goToInputNumber: function () {
    var self = this;
    wx.navigateTo({
      url: '/pages/inputnumber/inputnumber',
    });
  },
  scanCode: function () {
    var self = this;
    self.showMode();
    wx.scanCode({
      success: function (res) {
        var fields = res.result.split(',');
        if (fields.length === 5
          && (fields[0] !== 'device' || fields[0] !== 'http://weixin.qq.com/r/Tjq5oVzEzQGyrRjC929c?xcx=device' || fields[0] !== 'http://iot.xaircraft.com/?xcx=device')
          && ( (fields[1] === '1' && (fields[2] === '2' || fields[2] === '3'))
              || (fields[1] === '13' && fields[2] === '1') )
        ) { //有效条码
          let device_id = fields[3];
          wx.navigateTo({ //查看对应设备信息
            url: '../deviceinfo/deviceinfo?device_id=' + device_id + '&source=add',
          });
        } else {
          wx.showModal({
            title: '扫码失败',
            content: '无效条码',
          });
          return;
        }
      },
      fail: function (err) {
        if (err.errMsg === "scanCode:fail cancel") { //取消扫码
          return;
        } else if (err.errMsg === "scanCode:fail") {
          app.showModal('扫码失败', '无法识别');
        } else {
          app.showModal('扫码失败', '请检查你的网路设置');
        }
      },
    });
  },
  /**查看设备详情 */
  checkDetail: function(e) {
    let self = this;
    wx.navigateTo({
      url: '/pages/history/history?device_id=' + e.currentTarget.id,
      success: function() { //标记当前选中设备（以备改名后统一）
        self.setData({
          checked_id: e.currentTarget.id,
          checked_name: e.currentTarget.dataset.devicename,
        });
      },
    });
  },
  /** 获取失败*/
  setFailInfo: function() {
    this.setData({
      out_of_network: true,
    });
  },
  onLoad: function (options) {
    if (options.source && options.source === 'share') {
      wx.navigateTo({
        url: '/pages/history/history?device_id=' + options.device_id,
      })
    }
    photo_width = g_data.screenWidth - (20 + 30) * 2 * g_data.screenWidth / 750;
    this.loadDevices(false);
    this.setData({
      floating_bottom: 120,
      floating_right: 20,
      move_height: g_data.screenHeight,
    });
  },
  onShow: function () {
    if (g_data.devices && g_data.devices_new && g_data.devices_new.length !== g_data.devices.length) { //设备条数有变化
      g_data.devices = g_data.devices_new;
      this.do_show_devices();
    }
    g_data.devices_new = null
  },
  onHide: function () {
    this.setData({
      mode_is_visible: false,
    });
  },
  onPullDownRefresh: function() {
    this.loadDevices(true);
  },
  reload: function() {
    this.loadDevices(false);
  },
  share: function () { //不能去掉，用于阻止冒泡，且防止取消分享后无法再分享（fail last share not complete）
  },
  onShareAppMessage: function (e) {
    var share_info = e.target.dataset; //分享按钮携带的数据
    return {
      title: share_info.name || share_info.device_id,
      path: '/pages/index/index?&device_id=' + share_info.deviceid + '&source=share',
      imageUrl: share_info.imgsrc,
      fail: function (err) { // 转发失败
        if (err.errMsg !== 'shareAppMessage:fail cancel') {
          wx.showModal({
            title: '分享失败',
            content: JSON.stringify(err),
          });
        }
      },
    }
  },
});