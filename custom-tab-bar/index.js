Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconClass: "icon-home"
      },
      {
        pagePath: "/pages/statistics/statistics",
        text: "统计",
        iconClass: "icon-stats"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconClass: "icon-profile"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({
        url
      })
      this.setData({
        selected: data.index
      })
    }
  }
}) 