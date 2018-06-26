let app = getApp();
let g_data = app.globalData;

var get_user_info = function(callback) { //callback即为获取token后要调用的函数（function(user){}）
  var user = app.globalData.user_info || wx.getStorageSync('user_info');
  if (!user || user.expires_in * 1000 < Date.now()) { // token不存在或token已过期
    wx.login({
      success: function (res) {
        var code = res.code;
        if(!code) {
          app.showModal('登录失败','获取微信用户登录态失败，请稍后重试');
          callback(null);
          wx.hideLoading();
        } else {
          wx.getUserInfo({
            success: function (res) {
              var user = res.userInfo;
              wx.request({
                url: g_data.public_url + '/wapp_auth',
                method: 'POST',
                data: {
                  code: code,
                  iv: res.iv,
                  sign: res.signature,
                  enc_data: res.encryptedData,
                  raw_data: res.rawData,
                },
                success: function (res) {
                  if (res.statusCode == 200) {
                    user.accessToken = res.data.session;
                    user.expires_in = 24 * 60 * 60 + Math.round(Date.now() / 1000) - 60; //24小时过期
                    wx.setStorage({
                        key: "user_info",
                        data: user,
                    });
                    app.globalData.user_info = user;
                    callback(user);
                  } else {
                    wx.hideLoading();
                    app.showModal('授权失败', '获取服务器授权失败，' + res.data.message);
                    callback(null);
                  }
                },
                fail: function (err) {
                  wx.hideLoading();
                  app.showModal('登录失败', '获取服务器授权失败，' + err.data.message);
                  callback(null);
                },
              });
            },
            fail: function (err) {
              wx.hideLoading();
              if (err.errMsg === 'getUserInfo:fail auth deny') {
                app.showModal('授权失败', '获取用户信息失败，请删除当前应用后重新进入并同意授权' + err.errMsg);
              } else {
                app.showModal('登录失败', '获取用户信息失败，' + err.errMsg);
              }
              callback(null);
            },
          });
        }
      },
      fail: function (err) {
        wx.hideLoading();
        app.showModal('登录失败', '获取微信用户登录态失败，' + err.errMsg);
        callback(null);
      },
    });
  } else {
    callback(user);
  }
}

module.exports = {
  get_user_info: get_user_info
}