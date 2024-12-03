Page({
  data: {
    notificationEnabled: true,
    warningAmount: ''
  },

  onLoad() {
    const warningAmount = wx.getStorageSync('warningAmount') || '';
    this.setData({ warningAmount });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  // 页面导航
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  // 显示联系信息
  showContactInfo() {
    wx.showModal({
      title: '联系作者',
      content: '作者QQ：2082216455\n有问题请联系',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 切换通知开关
  toggleNotification(e) {
    const enabled = e.detail.value;
    this.setData({ notificationEnabled: enabled });
    
    if (enabled) {
      // 开启提醒后，监听支出变化
      this.startExpenseMonitoring();
    } else {
      // 关闭提醒
      this.stopExpenseMonitoring();
    }
  },

  // 清除数据
  clearData() {
    wx.showModal({
      title: '警告',
      content: '确定要清除所有记账数据吗？清除后数据将无法恢复！',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' });
          
          // 清除所有本地存储的数据
          wx.removeStorageSync('records');
          wx.removeStorageSync('warningAmount');
          wx.removeStorageSync('warningTriggered');
          
          // 重置页面数据
          this.setData({
            warningAmount: ''
          });

          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '已清除所有数据',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  // 修改预警金额
  onWarningAmountChange(e) {
    const warningAmount = e.detail.value;
    this.setData({ warningAmount });
    wx.setStorageSync('warningAmount', warningAmount);
    
    // 重置预警状态
    if (warningAmount) {
      wx.setStorageSync('warningTriggered', false);
    }
  },

  // 开始支出监控
  startExpenseMonitoring() {
    if (!this.data.warningAmount) return;

    // 获取当前月份的支出总额
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const records = wx.getStorageSync('records') || [];
    
    // 计算本月支出
    const monthExpense = records.reduce((total, record) => {
      const recordDate = new Date(record.date);
      if (recordDate.getFullYear() === currentYear && 
          recordDate.getMonth() + 1 === currentMonth && 
          record.type === 'expense') {
        return total + parseFloat(record.amount);
      }
      return total;
    }, 0);

    // 检查是否已经触发过预警
    const warningTriggered = wx.getStorageSync('warningTriggered') || false;
    const warningAmount = parseFloat(this.data.warningAmount);

    // 只在首次超出时提示
    if (monthExpense > warningAmount && !warningTriggered && this.data.notificationEnabled) {
      wx.showModal({
        title: '支出预警',
        content: `本月支出已超过预警金额${warningAmount}元！请注意控制支出。`,
        showCancel: false
      });
      // 标记已触发预警
      wx.setStorageSync('warningTriggered', true);
    }
  },

  // 停止支出监控
  stopExpenseMonitoring() {
    // 清除预警状态
    wx.setStorageSync('warningTriggered', false);
  }
});
