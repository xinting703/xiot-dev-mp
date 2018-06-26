// pages/qrcode/qrcode.js
const QR = require("../../dist/qrcode.js");
const g_data = getApp().globalData;
Page({
  data: {
  },
  onLoad: function (options) {
    let size = 370 * g_data.px_scale; //动态设置画布大小
    let qrcode_text = decodeURI(options.qrcode_text);
    qrcode_text = 'http://weixin.qq.com/r/Tjq5oVzEzQGyrRjC929c?xcx=' + qrcode_text;
    this.createQrCode(qrcode_text, "mycanvas", size, size);

    let device_id = qrcode_text.split(',')[3];
    if (options.is_owner !== 'true') {
      device_id = device_id.substring(0, device_id.length - 4) + '****';
    }
    this.setData({
      canvas_size: size,
      device_id: device_id,
    });
  },
  createQrCode: function (url, canvasId, cavW, cavH) {
    QR.qrApi.draw(url, canvasId, cavW, cavH);
  },
});