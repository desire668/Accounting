import WxCanvas from './wx-canvas';
import * as echarts from './echarts';

let ctx;

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },

    ec: {
      type: Object
    }
  },

  data: {
    isUseNewCanvas: false
  },

  ready: function () {
    if (!this.data.ec) {
      console.warn('组件需绑定 ec 变量，例：<ec-canvas id="mychart-dom-bar" canvas-id="mychart-bar" ec="{{ ec }}"></ec-canvas>');
      return;
    }

    if (!this.data.ec.lazyLoad) {
      this.init();
    }
  },

  methods: {
    init: function (callback) {
      const version = wx.getSystemInfoSync().SDKVersion;
      const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0;
      const forceUseOldCanvas = this.data.ec.forceUseOldCanvas;
      const isUseNewCanvas = canUseNewCanvas && !forceUseOldCanvas;
      this.setData({ isUseNewCanvas });

      if (forceUseOldCanvas && canUseNewCanvas) {
        console.warn('开发者强制使用旧canvas,建议关闭');
      }

      if (isUseNewCanvas) {
        const query = wx.createSelectorQuery().in(this);
        query
          .select('.ec-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            const dpr = wx.getSystemInfoSync().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);

            echarts.setCanvasCreator(() => {
              return canvas;
            });

            const canvasDpr = dpr;
            var chart = echarts.init(canvas, null, {
              width: res[0].width,
              height: res[0].height,
              devicePixelRatio: canvasDpr
            });
            if (typeof callback === 'function') {
              this.chart = chart;
              callback(chart);
            }
            if (typeof this.data.ec.onInit === 'function') {
              this.chart = chart;
              this.data.ec.onInit(chart);
            }
          });
      } else {
        ctx = wx.createCanvasContext(this.data.canvasId, this);
        const canvas = new WxCanvas(ctx, this.data.canvasId, false);

        echarts.setCanvasCreator(() => {
          return canvas;
        });

        const query = wx.createSelectorQuery().in(this);
        query
          .select('.ec-canvas')
          .boundingClientRect((res) => {
            if (typeof callback === 'function') {
              this.chart = echarts.init(canvas, null, {
                width: res.width,
                height: res.height
              });
              callback(this.chart);
            } else if (typeof this.data.ec.onInit === 'function') {
              this.chart = echarts.init(canvas, null, {
                width: res.width,
                height: res.height
              });
              this.data.ec.onInit(this.chart);
            }
          })
          .exec();
      }
    },

    canvasToTempFilePath(opt) {
      if (this.data.isUseNewCanvas) {
        const query = wx.createSelectorQuery().in(this);
        query
          .select('.ec-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvas = res[0].node;
            opt.canvas = canvas;
            wx.canvasToTempFilePath(opt);
          });
      } else {
        if (!opt.canvasId) {
          opt.canvasId = this.data.canvasId;
        }
        ctx.draw(true, () => {
          wx.canvasToTempFilePath(opt, this);
        });
      }
    },

    touchStart(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousedown', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'start');
      }
    },

    touchMove(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'change');
      }
    },

    touchEnd(e) {
      if (this.chart) {
        const touch = e.changedTouches ? e.changedTouches[0] : {};
        var handler = this.chart.getZr().handler;
        handler.dispatch('mouseup', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.dispatch('click', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'end');
      }
    }
  }
});

function compareVersion(v1, v2) {
  v1 = v1.split('.');
  v2 = v2.split('.');
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

function wrapTouch(event) {
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i];
    touch.offsetX = touch.x;
    touch.offsetY = touch.y;
  }
  return event;
} 