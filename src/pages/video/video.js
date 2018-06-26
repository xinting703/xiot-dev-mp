// pages/video/video.js
var app = getApp();
var g_data = app.globalData;
Page({
  data: {
    display: false,
    fit: 'fill',
    downloading: false,
  },
  /**转发 */
  shareFile: function() {

  },
  /**下载视频 */
  saveFile: function() {
    var that = this;    
    var video_src = that.data.video_src;
    wx.getSetting({ //获取用户的当前设置
      success: function(res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: function(res) {
              // 用户已经同意小程序使用视频保存功能，后续调用不会再弹窗询问
              that.download_file();
            },
            fail: function (err) {
              if (err.errMsg === 'authorize:fail auth deny') {
                // app.showModal('视频保存失败', '请允许授权保存图片或视频到你的相册');
                wx.showModal({
                  title: '视频保存失败',
                  content: '请允许授权保存视频到你的相册',
                  success: function (res) {
                    if (res.confirm) {
                      wx.openSetting({
                        success: function (res) {
                          // if (!res.authSetting["scope.userInfo"] || !res.authSetting["scope.userLocation"]) {
                          //   //这里是授权成功之后 填写你重新获取数据的js
                          //   //参考:
                          //   that.getLogiCallback('', function () {
                          //     callback('')
                          //   })
                          // }
                        },
                      });
                    }
                  },
                });
              } else {
                app.showModal('视频保存失败', '请检查你的网络设置');
              }
            },
          });
        } else {
          that.download_file();
        }
      },
      fail: function(err) {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: function (res) {
            that.download_file();
          },
          fail: function (err) {
            if (err.errMsg === 'authorize:fail auth deny') {
              app.showModal('视频保存失败', '请允许授权保存图片或视频到你的相册');
            } else {
              app.showModal('视频保存失败', '请检查你的网络设置');
            }
          },
        })
      },
    });
  },
  /**下载文件 */
  download_file: function() {
    var that = this;
    that.setData({
      downloading: true,
    });
    var video_src = this.data.video_src;
    var valid_src = video_src.split(':')[0] + 's:' + video_src.split(':')[1];

    wx.downloadFile({
      url: valid_src,
      success: function (res) {
        wx.saveVideoToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function (res) {
            app.showSuccess('已保存');
            that.setData({
              downloading: false,
            });
          },
          fail: function (err) {
            that.setData({
              downloading: false,
            });
            if (err.errMsg === 'saveVideoToPhotosAlbum:fail cancel') { //取消选择存放地址（PC端）
              return;
            }
            app.showModal('视频保存失败', JSON.stringify(err));
          }
        });
      },
      fail: function (err) {
        that.setData({
          downloading: false,
        });
        app.showModal('视频下载失败', JSON.stringify(err));
      },
    });
  },
  fullscreenchange: function(e) {
    this.setData({
      fit: e.detail.fullScreen ? 'contain' : 'fill',
    });
  },
  onLoad: function (options) {
    var that = this;
    var screen_width = g_data.video_width || 0;
    wx.getSystemInfo({ //获取设备高度
      success: function (res) {
        screen_width = res.windowWidth || res.screenWidth;
      },
      complete: function () {
        that.setData({
          video_src: options.video_src,
          img_src: options.img_src + '?x-oss-process=image/resize,w_' + Math.ceil(screen_width),
          video_width: screen_width,
          video_height: screen_width * Number(options.scale),
          scale: Number(options.scale),
          display: true,
        });
      },
    });
  },
})