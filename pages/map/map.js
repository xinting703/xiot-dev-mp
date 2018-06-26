// pages/map/map.js
let get_user_info = require('../../dist/user.js').get_user_info;

let app = getApp();
let g_data = app.globalData;

let full_photo_width = 0;

let gps_devices = []; //原始GPS设备
let cell_devices = []; //原始基站设备

let gps_points_of_cell = [];

let tmp_markers = []; //用于赋值的marker

Page({
  data: {
    latitude: 23.099994,
    longitude: 113.324520,
    markers: [],
    photo_is_visible: false, //显示照片面板
  },
  /**点击整个地图 */
  clickMap: function(e) {
    let controls = this.data.controls;
    controls[0].position.top = g_data.screenHeight - 110;
    this.setData({
      photo_is_visible: false,
      map_height: g_data.screenHeight,
      controls: controls,
    });
  },
  /**点击marker */
  clickMarker: function(e) {
    let self = this;
    let cur_device_id = e.markerId;
    if (self.data.device_id === cur_device_id && self.data.photo_is_visible) { //当前点面板已展开
      return;
    }
    let markers_copy = JSON.parse(JSON.stringify(self.data.markers)); //全部marker
    let target_marker = [];

    for (let i = 0; i < markers_copy.length; ++i) {
      markers_copy[i].iconPath = markers_copy[i].iconPath.replace('sel', 'nor'); //全部转为正常形态
      if (markers_copy[i].id === cur_device_id) {
        target_marker = markers_copy[i];
        target_marker.iconPath = target_marker.iconPath.replace('nor', 'sel');
      }
    }

    self.setData({
      markers: markers_copy,
    });

    self.get_nearest_photo(cur_device_id); //获取图像信息
    self.get_basic_info(cur_device_id); //获取基本信息

    for (let i = 0; i < gps_points_of_cell.length; ++i) {
      if (gps_points_of_cell[i].id === cur_device_id) {
        self.setData({
          address: gps_points_of_cell[i].address,
        });
        return;
      }
    }

    let tmp_address = '';
    wx.request({ //使用腾讯坐标转换成地理位置,纬度前经度后,coord_type=1为使用GPS坐标转换5为使用腾讯、高德或Google,get_poi=0不返回周边POI列表
      url: 'https://apis.map.qq.com/ws/geocoder/v1/?location=' + target_marker.latitude + ',' + target_marker.longitude + '&coord_type=5&get_poi=0&key=35UBZ-RJ7H5-OFHI4-Q4327-ITX2H-PAFOW',
      header: {
        'Content-Type': 'application/json',
      },
      success: function (res) {
        if (res.statusCode === 200) {
          let rs_data = res.data.result;
          tmp_address = rs_data.address || rs_data.address_component.nation + rs_data.address_component.province + rs_data.address_component.city + rs_data.address_component.street;
        }
      },
      complete: function() {
        self.setData({
          address: tmp_address,
        });
      },
    });
  },
  /**点击控件 */
  tapControl: function() {
    gps_devices = [];
    cell_devices = [];
    this.get_location();
  },
  /**关注 */
  tapFollow: function (e) {
    let self = this;
    get_user_info(function (user) {
      if (user) {
        wx.request({
          url: g_data.public_url + "/devices?access_token=" + user.accessToken,
          method: "POST",
          data: {
            device_id: e.currentTarget.id,
          },
          success: function (res) {
            if (res.statusCode === 201) { //关注成功
              app.showSuccess('关注成功');
              self.setData({
                has_followed: true, //将设备设置成已关注
              });
              self.reget_devices();
            } else {
              app.showModal('关注失败', JSON.stringify(res.data.message));
            }
          },
          fail: function (err) {
            app.showModal('关注失败', JSON.stringify(err));
          },
          complete: function () {
            wx.hideLoading();
          },
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
          },
          complete: function () {
            // wx.switchTab({
            //   url: '/pages/index/index',
            // });
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
              self.setData({
                device_id: cur_dev.device_id,
                name: cur_dev.name,
                has_followed: cur_dev.follow,
              });
            }
          },
        });
      }
    });
  },
  /**获取最近一张图片 */
  get_nearest_photo: function (device_id) {
    let self = this;
    let default_height = g_data.photo_ratio * full_photo_width; // 100% * H/W
    self.setData({
      photo: {
        src: '',
        height: g_data.photo_ratio * full_photo_width,
      },
    });
    get_user_info(function (user) {
      if (user) {
        wx.request({ //取图片
          url: g_data.public_url + '/devices/' + device_id + '/datapoints?type=photo&access_token=' + user.accessToken,
          method: 'GET',
          success: function (res) {
            if (res.statusCode === 200) {
              if (res.data.datapoints && res.data.datapoints.length && res.data.datapoints[0].data) {
                let img_data = res.data.datapoints[0].data; //图像数据
                self.setData({
                  photo: {
                    src: img_data.url + '?x-oss-process=image/resize,w_' + Math.ceil(img_data.width / g_data.thumbnail),
                    height: img_data.height / img_data.width * full_photo_width,
                  },
                });
              }
            }//设定了默认值，不用处理else
          },
          complete: function() {
            let info_height = self.data.photo.src ? g_data.screenHeight - (40 + 40 + 20 + 30 + 20 + 120) * g_data.px_scale - self.data.photo.height : g_data.screenHeight - (40 + 40 + 30 + 120) * g_data.px_scale;
            let controls = self.data.controls;
            controls[0].position.top = info_height - 110;
            self.setData({
              map_height: info_height,
              photo_is_visible: true,
              controls: controls,
            });
          },
        });
      }
    });
  },
  /**转换成腾讯地图坐标 */
  gps2tenx: function(points) {
    let self = this;
    let los_str = '';
    for(let i = 0 ; i < points.length; ++i) {
      los_str += points[i].location.latitude + ',' + points[i].location.longitude + ';';
    }
    
    let locations = los_str.substr(0, los_str.length - 1);
    wx.request({
      url: 'https://apis.map.qq.com/ws/coord/v1/translate?locations=' + locations +'&type=1&key=35UBZ-RJ7H5-OFHI4-Q4327-ITX2H-PAFOW',
      method: 'GET',
      success: function(res) {
        if (res.statusCode === 200) { //转换成腾讯坐标成功
          let res_locations = res.data.locations;
          for (let j = 0; j < res_locations.length; ++j) {
            let tmp_icon_marker = points[j].is_owner ? '/images/map/near_icon_address2_nor.png' : '/images/map/near_icon_address1_nor.png';
            tmp_markers.push({
              iconPath: tmp_icon_marker,
              id: points[j].device_id,
              latitude: res_locations[j].lat,
              longitude: res_locations[j].lng,
              width: 28,
              height: 33,
            });
          }
          self.setData({
            markers: tmp_markers,
          });
        } else {
          app.showModal('坐标转换失败', JSON.stringify(res.data.message));
        }
      },
      fail: function (err) {
        app.showModal('坐标转换失败', JSON.stringify(err));
      },
      complete: function() {
        wx.hideLoading(); //有marker出现
      },
    });
  },
  /**基站信息-->GPS信息 */
  cell2gps: function(points) {
    let self = this;
    let cell_count = 0;
    points.forEach(function(point, index) {
      let cell = point.network.cell;
      let query_str = 'mcc=' + cell.mcc + '&mnc=' + cell.mnc + '&lac=' + cell.lac + '&ci=' + cell.cell_id;
      wx.request({ //基站信息转转GPS信息
        url: "https://iot.xaircraft.com/fm/admin2/cell?" + query_str + "&output=json",
        method: 'GET',
        success: function (res) {
          if (res.data.errcode === 0) { //转换成功
            point.location = {
              longitude: res.data.lon,
              latitude: res.data.lat,              
            },
            point['address'] = res.data.address;
            gps_points_of_cell.push(point);
          }
        },
        complete: function() {
          cell_count++;
          if (cell_count === points.length && gps_points_of_cell.length) { //基站转换完成且有合法点存在
            self.gps2tenx(gps_points_of_cell);
          }
        },
      });
    });
  },
  /**获取附近设备 */
  get_near_devices: function (longitude, latitude) {
    let self = this;
    get_user_info(function (user) {
      if (user) {
        wx.request({
          url: g_data.public_url + '/nearby_devices' + '?longitude=' + longitude + '&latitude=' + latitude + '&access_token=' + user.accessToken,
          method: 'GET',
          success: function (res) {
            if (res.statusCode === 200) { //成功获取
              if (!res.data.devices.length) {
                app.showModal('', '暂无附近设备');
                return; //去到complete
              }
              for (let i = 0; i < res.data.devices.length; ++i) {
                let cur_dev = res.data.devices[i];
                if (cur_dev.location && cur_dev.location.longitude && cur_dev.location.latitude && (cur_dev.voiced_at - cur_dev.location.fixed_at < 5 * 60 || !cur_dev.network || !cur_dev.network.cell)) { //GPS定位
                  gps_devices.push(cur_dev);
                } else if (cur_dev.network && cur_dev.network.cell) { //基站定位
                  cell_devices.push(cur_dev);
                }
              }

              if (gps_devices.length) {
                self.gps2tenx(gps_devices);  //GPS->腾讯
              }
              if (cell_devices.length) {
                self.cell2gps(cell_devices); //基站->GPS
              }
            } else { //获取不成功
              app.showModal('获取失败', JSON.stringify(res.data.message));
            }
          },
          fail: function (err) {
            app.showModal('获取失败', JSON.stringify(err));
          },
          complete: function () {
            wx.hideLoading();
          },
        });
      }
    });
  },
  /**获取当前位置 */
  get_location: function() {
    let self = this;
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        self.get_near_devices(res.longitude, res.latitude);
        self.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      },
      fail: function (err) {
        wx.hideLoading();
        app.showModal('获取当前位置失败', JSON.stringify(err));
      },
    });
  },
  onLoad: function (options) {
    wx.showLoading({
      title: '正在获取',
    });
    let self = this;
    self.get_location();
    full_photo_width = g_data.screenWidth - 20 * 2 * g_data.px_scale;
    self.setData({
      map_width: g_data.screenWidth,
      map_height: g_data.screenHeight,
      controls: [{
        id: 1,
        iconPath: '/images/map/button_position.png',
        position: {
          left: g_data.screenWidth - 30 - 23,
          top: g_data.screenHeight - 110,
          width: 46,
          height: 49
        },
        clickable: true
      }],
    });
  },
  onShow: function () {
    if (g_data.deleted_id === this.data.device_id) {
      this.setData({
        has_followed: false,
      });
    }
    g_data.deleted_id = null; //清空
    if (g_data.edited_device && g_data.edited_device.device_id === this.data.device_id) {
      this.setData({
        name: g_data.edited_device.name,
      });
    }
    g_data.edited_device = null;
  },
});