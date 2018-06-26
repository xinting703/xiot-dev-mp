// pages/history/history.js
const get_user_info = require('../../dist/user.js').get_user_info;
const moment = require('../../dist/moment.min.js');
const app = getApp();
const g_data = app.globalData;

let device_id = '';
let per_count = 10;
let full_photo_width = 0; //图片宽度（基准值，用于计算高度）
let half_photo_width = 0;

function week_format(idx) { //星期格式化
  let day = '';
  switch (idx) {
    case 0:
      day = '一';
      break;
    case 1:
      day = '二';
      break;
    case 2:
      day = '三';
      break;
    case 3:
      day = '四';
      break;
    case 4:
      day = '五';
      break;
    case 5:
      day = '六';
      break;
    case 6:
      day = '日';
      break;
  }
  return day;
}

Page({
  data: {
  },
  /**查看设备信息 */
  checkDeviceInfo: function() {
    wx.navigateTo({
      url: '/pages/deviceinfo/deviceinfo?device_id='+device_id,
    });
  },
  /**查看视频 */
  checkVideo: function () {
    let self = this;
    let day_idx = self.data.current_tab;
    let week = self.data.week;
    get_user_info(function (user) {
      if (user) {
        wx.request({ //取视频
          url: g_data.public_url + '/devices/' + device_id + '/datapoints?type=statistics&start=' + week[day_idx].since + '&end=' + week[day_idx].until + '&order=desc&access_token=' + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) {
              let datapoints = res.data.datapoints;
              if (datapoints.length && datapoints[0].data && datapoints[0].data.photo && datapoints[0].data.video) { //统计数据中有图片及视频
                let data = datapoints[0].data;
                wx.navigateTo({
                  url: '../video/video?video_src=' + data.video.url + '&img_src=' + data.photo.url + '&scale=' + data.video.height / data.video.width,
                });
              } else { // 无视频
                wx.showModal({
                  content: '暂无当天视频',
                  showCancel: false,
                  success: function (res) {
                    if (res.confirm) {
                      week[day_idx]['noVideo'] = true;
                      self.setData({
                        week: week
                      });
                    }
                  }
                })
              }
            } else {
              app.showModal('获取失败', JSON.stringify(res.data.message));
            }
          },
          fail: function (err) {
            app.showModal('获取失败', JSON.stringify(err));
          }
        });
      }
    });
  },
  /**tab切换(日期)*/
  tabClick: function (e) {
    let self = this;
    let day_idx = Number(e.currentTarget.id);
    self.setData({
      current_tab: day_idx,
    });
    if (!self.data.week[day_idx].photo.loaded) { //未加载过
      self.get_photos(day_idx);
    }
  },
  /**预览图片集 */
  previewImage: function(e) {
    let self = this;
    let photo_list = self.data.week[self.data.current_tab].photo.list;
    let urls = [];
    for (let i = 0; i < photo_list.length; ++i) {
      urls.push(photo_list[i].src.split('?')[0]);
    }
    wx.previewImage({
      current: urls[e.currentTarget.dataset.imgidx], // 当前显示图片的http链接
      urls: urls, // 需要预览的图片http链接列表
    });
  },
  /**查看顶部大图 */
  checkTopPhoto: function(e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.src],
    });
  },
  /**获取图片集 */
  get_photos: function (day_idx) {
    let self = this;
    let week = self.data.week;
    let photo = self.data.week[day_idx].photo;
    let since = self.data.week[day_idx].since;
    let until = self.data.week[day_idx].until;
    get_user_info(function (user) {
      if (user) {
        wx.request({
          url: g_data.public_url + '/devices/' + device_id + '/datapoints?type=photo&cursor=' + photo.cursor + '&count=' + per_count + '&start=' + week[day_idx].since + '&end=' + week[day_idx].until + '&order=desc&access_token=' + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) {
              photo.loaded = true; //标识当前日期图片已加载过
              if (res.data.datapoints && res.data.datapoints.length) {
                let datapoints = res.data.datapoints;
                //循环显示图片列表
                for (let i = 0; i < datapoints.length; ++i) {
                  let img_data = datapoints[i].data;
                  photo.list.push({
                    src: img_data.url + '?x-oss-process=image/resize,w_' + img_data.width / 4,
                    height: img_data.height / img_data.width * half_photo_width,
                    interval: moment(1000 * datapoints[i].created_at).format('HH:mm'),
                  });
                }
              }

              photo.cursor = res.data.cursor; //取完之后会变空
              if (!photo.cursor && !res.data.datapoints.length && !photo.list.length) { //没有图片
                photo.amount = 'empty';
                return;
              } else if (res.data.datapoints.length && res.data.cursor === '') { //取完
                photo.amount = 'full';
              }
            }
          },
          complete: function () {
            self.setData({
              week: week,
              is_loading: false
            });
          },
        });
      }
    });
  },
  /**获取基本信息 */
  get_basic_info: function (device_id) {
    let self = this;
    get_user_info(function (user) {
      if (user) {
        wx.request({ //获取设备信息
          url: g_data.public_url + '/devices/' + device_id + "?access_token=" + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) { //成功
              let cur_dev = res.data.device;
              if (!cur_dev.is_owner && cur_dev.access_control === 'private') { // 非拥有者且设备被关闭共享
                self.reget_devices()
                self.setData({
                  noPermission: true
                })
                return
              }

              if (!cur_dev.follow) { // 还未关注设备（针对分享进入情况）,已加入列表则不会进入此判断（follow为true）
                self.addDevice(device_id)
              }

              self.get_photos(self.data.current_tab);
              self.getAddress(cur_dev)

              // 设置顶部图片信息
              let tmpPhoto = {
                src: '',
                height: g_data.photo_ratio * full_photo_width
              }
              if (cur_dev.datapoints && cur_dev.datapoints.length) {
                for (let j = 0; j < cur_dev.datapoints.length; ++j) { //type可能多种，例如photo，weather等
                  let cur_datapoint = cur_dev.datapoints[j];
                  if (cur_datapoint.type === 'photo' && cur_datapoint.data) {
                    let src = cur_datapoint.data.url + '?x-oss-process=image/resize,w_' + Math.ceil(cur_datapoint.data.width / 5);
                    tmpPhoto = {
                      src: src,
                      height: cur_datapoint.data.height / cur_datapoint.data.width * full_photo_width,
                      time: moment(1000 * cur_datapoint.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    }
                  }
                }
              }
              self.setData({
                top_photo: tmpPhoto
              });
              
              let operator = cur_dev.network && cur_dev.network.cell && g_data.mnc2name[cur_dev.network.cell.mcc] && g_data.mnc2name[cur_dev.network.cell.mcc][cur_dev.network.cell.mnc] ? g_data.mnc2name[cur_dev.network.cell.mcc][cur_dev.network.cell.mnc] : '未知运营商';

              self.setData({
                basic_info: {
                  device_id: cur_dev.device_id,
                  status: cur_dev.status,
                  name: cur_dev.name || '--',
                  icon_signal: cur_dev.network ? app.get_icon_signal(cur_dev.network.RSSI) : '',
                  operator: operator,
                  battery_level: cur_dev.battery.level <= 100 ? (cur_dev.battery.level + '%') : '',
                  battery_color: app.get_battery_color(cur_dev.battery.level),
                  charging: cur_dev.battery.charging,
                }
              });
            }
          },
          complete: function () {
            wx.hideLoading();
          },
        });
      }
    });
  },
  /**
   * 转换地理位置信息
   */
  getAddress: function(cur_dev) {
    let self = this
    let tmp_address = '暂无位置信息'
    if (cur_dev.location && cur_dev.location.longitude && cur_dev.location.latitude && (cur_dev.voiced_at - cur_dev.location.fixed_at < 5 * 60 || !cur_dev.network || !cur_dev.network.cell)) {
      wx.request({ //使用腾讯坐标转换成地理位置,纬度前经度后,coord_type=1为使用GPS坐标转换5为使用腾讯、高德或Google,get_poi=0不返回周边POI列表
        url: 'https://apis.map.qq.com/ws/geocoder/v1/?location=' + cur_dev.location.latitude + ',' + cur_dev.location.longitude + '&coord_type=1&get_poi=0&key=35UBZ-RJ7H5-OFHI4-Q4327-ITX2H-PAFOW',
        header: {
          'Content-Type': 'application/json',
        },
        success: function (res) {
          if (res.statusCode === 200) {
            let rs_data = res.data.result;
            tmp_address = rs_data.address || rs_data.address_component.nation + rs_data.address_component.province + rs_data.address_component.city + rs_data.address_component.street;
          }
        },
        complete: function () {
          self.setData({
            address: tmp_address,
          });
        },
      });
    } else if (cur_dev.network && cur_dev.network.cell) {
      let cell = cur_dev.network.cell;
      let query_str = 'mcc=' + cell.mcc + '&mnc=' + cell.mnc + '&lac=' + cell.lac + '&ci=' + cell.cell_id;
      wx.request({ //基站信息转转GPS信息
        url: "https://iot.xaircraft.com/fm/admin2/cell?" + query_str + "&output=json",
        method: 'GET',
        success: function (res) {
          if (res.data.errcode === 0) { //转换成功
            tmp_address = res.data.address;
          }
        },
        complete: function () {
          self.setData({
            address: tmp_address,
          });
        },
      });
    } else {
      self.setData({
        address: tmp_address,
      });
    }
  },
  /**添加设备 */
  addDevice: function (device_id) {
    let self = this;
    get_user_info(function (user) {
      if (user) {
        wx.request({
          url: g_data.public_url + "/devices?access_token=" + user.accessToken,
          method: "POST",
          data: {
            device_id: device_id,
          },
          complete: function() { // 添加完重取设备（无论成功失败）
            self.reget_devices()
          }
        });
      }
    });
  },
  /**重新获取全部设备 */
  reget_devices: function () {
    get_user_info(function (user) {
      if (user) {
        wx.request({ //获取全部设备
          url: g_data.public_url + "/devices?count=" + g_data.dev_per_count + "&offset=0&access_token=" + user.accessToken,
          method: "GET",
          success: function (res) {
            if (res.statusCode === 200) {
              g_data.devices_new = res.data.devices;
            }
          }
        });
      }
    });
  },
  onLoad: function (options) {
    device_id = options.device_id; //设置全局device_id，便于多次获取图片
    full_photo_width = g_data.screenWidth - 20 * 2 * g_data.px_scale;
    half_photo_width = 0.5 * (g_data.screenWidth - (4 + 10) * 2 * g_data.px_scale);
    let self = this;

    let week = [
      { //tab初始化
        idx: 0,
        name: week_format(moment().add(-5, 'days').weekday()),
        date: moment().add(-5, 'days').format('YYYY-MM-DD'),
        showDate: moment().add(-5, 'days').format('MM/DD'),
        since: moment(moment().add(-5, 'days').format('YYYY-MM-DD') + ' 00:00:00').unix(),
        until: moment(moment().add(-5, 'days').format('YYYY-MM-DD') + ' 23:59:59').unix(),
        photo: {
          cursor: '',
          loaded: false,
          amount: 'unknown',
          list: [],
        },
      },
      {
        idx: 1,
        name: week_format(moment().add(-4, 'days').weekday()),
        date: moment().add(-4, 'days').format('YYYY-MM-DD'),
        showDate: moment().add(-4, 'days').format('MM/DD'),
        since: moment(moment().add(-4, 'days').format('YYYY-MM-DD') + ' 00:00:00').unix(),
        until: moment(moment().add(-4, 'days').format('YYYY-MM-DD') + ' 23:59:59').unix(),
        photo: {
          cursor: '',
          loaded: false,
          amount: 'unknown',
          list: [],
        },
      },
      {
        idx: 2,
        name: week_format(moment().add(-3, 'days').weekday()),
        date: moment().add(-3, 'days').format('YYYY-MM-DD'),
        showDate: moment().add(-3, 'days').format('MM/DD'),
        since: moment(moment().add(-3, 'days').format('YYYY-MM-DD') + ' 00:00:00').unix(),
        until: moment(moment().add(-3, 'days').format('YYYY-MM-DD') + ' 23:59:59').unix(),
        photo: {
          cursor: '',
          loaded: false,
          amount: 'unknown',
          list: [],
        },
      },
      {
        idx: 3,
        name: week_format(moment().add(-2, 'days').weekday()),
        date: moment().add(-2, 'days').format('YYYY-MM-DD'),
        showDate: moment().add(-2, 'days').format('MM/DD'),
        since: moment(moment().add(-2, 'days').format('YYYY-MM-DD') + ' 00:00:00').unix(),
        until: moment(moment().add(-2, 'days').format('YYYY-MM-DD') + ' 23:59:59').unix(),
        photo: {
          cursor: '',
          loaded: false,
          amount: 'unknown',
          list: [],
        },
      },
      {
        idx: 4,
        name: week_format(moment().add(-1, 'days').weekday()),
        date: moment().add(-1, 'days').format('YYYY-MM-DD'),
        showDate: moment().add(-1, 'days').format('MM/DD'),
        since: moment(moment().add(-1, 'days').format('YYYY-MM-DD') + ' 00:00:00').unix(),
        until: moment(moment().add(-1, 'days').format('YYYY-MM-DD') + ' 23:59:59').unix(),
        photo: {
          cursor: '',
          loaded: false,
          amount: 'unknown',
          list: [],
        },
      },
      {
        idx: 5,
        name: week_format(moment().weekday()),
        date: moment().format('YYYY-MM-DD'),
        showDate: moment().format('MM/DD'),
        since: moment(moment().format('YYYY-MM-DD') + ' 00:00:00').unix(),
        // until: moment().add(-3, 'hours').unix(),
        until: moment().unix(),
        photo: {
          cursor: '',
          loaded: false,
          amount: 'unknown',
          list: [],
        },
      }
    ];

    self.setData({
      week: week,
      current_tab: 5, //当前日期
      video_available: (week[week.length - 1].until - week[week.length - 1].since) / 3600 > 1, /*是否到达video合成的时间 */
    });

    wx.showLoading({
      title: '正在加载',
    }); // 设备信息获取成功后即hide

    // 获取设备信息及图片
    self.get_basic_info(device_id);
  },
  onPageScroll: function(e) {
    if (!this.data.top_photo) {
      return
    }
    let distance_above = this.data.top_photo.height + (30 + 40 + 50 + 80 + 20) * g_data.px_scale; //顶部块高度
    let tab_fixed = e.scrollTop >= distance_above ? true :false;
    if(!tab_fixed) {
      this.setData({
        tab_fixed: tab_fixed,
      });
      return;
    }
    let screen_height = g_data.screenHeight + 50; //tabbar 50px(固定值)

    let idx = this.data.current_tab;
    let photo_info = this.data.week[idx].photo;
    let rows = Math.ceil(photo_info.list.length / 2); //图片行数
    let row_height = photo_info.list[0].height + 20 * g_data.px_scale; //图片高度（单行）
    let more_height = (100 + 44) * g_data.px_scale; //查看更多按钮高度
    let list_height = photo_info.amount === 'full' ? rows * row_height : rows * row_height + more_height;
    if(list_height > screen_height) { //照片列表大于一屏
      this.setData({
        tab_fixed: true,
      });
    }
  },
  onReachBottom: function () {
    /**查看更多图片 */
    let self = this;
    if (this.data.is_loading) { //防止重复加载
      return;
    }
    let idx = this.data.current_tab;
    if (this.data.week[idx].photo.amount !== 'empty' && this.data.week[idx].photo.amount !== 'full') {
      this.setData({
        is_loading: true,
      });
      this.get_photos(idx);
    }
    if (this.data.week[idx].photo.amount === 'full' && !this.data.no_more) {
      self.setData({
        no_more: true,
      });
      setTimeout(function () {
        self.setData({
          no_more: false,
        });
      }, 1500);
    }
  }
});