Page({
  data: {
    type: 'expense',
    amount: '',
    selectedCategory: null,
    categories: [
      { id: 1, name: '餐饮', icon: 'icon-food' },
      { id: 2, name: '交通', icon: 'icon-transport' },
      { id: 3, name: '购物', icon: 'icon-shopping' },
      { id: 4, name: '娱乐', icon: 'icon-entertainment' },
      { id: 5, name: '居住', icon: 'icon-house' },
      { id: 6, name: '医疗', icon: 'icon-medical' }
    ],
    date: '',
    remark: '',
    time: '12:00'
  },

  onLoad(options) {
    // 设置初始类型（支出/收入）
    if (options.type) {
      this.setData({ 
        type: options.type,
        // 如果是收入，自动设置一个默认分类
        selectedCategory: options.type === 'income' ? 0 : null
      })
    }
    // 设置当前日期
    this.setData({
      date: this.formatDate(new Date())
    })
    // 设置当前时间
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.setData({
      time: `${hours}:${minutes}`
    });
  },

  // 切换类型
  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 
      type,
      // 切换到收入时，自动设置默认分类
      selectedCategory: type === 'income' ? 0 : null
    });
  },

  // 金额输入
  onAmountInput(e) {
    let value = e.detail.value;
    // 限制只能输数字和小数点
    value = value.replace(/[^\d.]/g, '');
    // 限制只能有一个小数点
    value = value.replace(/\.{2,}/g, '.');
    // 限制小数点后只能有两位
    if (value.indexOf('.') > 0) {
      value = value.slice(0, value.indexOf('.') + 3);
    }
    this.setData({ amount: value });
  },

  // 选择分类
  selectCategory(e) {
    // 如果是收入类型，不处理分类选择
    if (this.data.type === 'income') return;
    
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedCategory: id });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 添加时间选择处理函数
  onTimeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  // 保存记录
  saveRecord() {
    if (!this.validateForm()) {
      return;
    }

    const record = {
      id: new Date().getTime(),
      type: this.data.type,
      amount: this.data.amount,
      category: this.data.type === 'income' ? 
        { id: 0, name: '收入', icon: 'icon-salary' } : // 收入使用默认分类
        this.data.categories.find(c => c.id === this.data.selectedCategory),
      date: `${this.data.date} ${this.data.time}`,
      remark: this.data.remark
    };

    // 获取现有记录
    let records = wx.getStorageSync('records') || [];
    // 添加新记录
    records.unshift(record);
    // 保存回存储
    wx.setStorageSync('records', records);

    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    });
  },

  // 表单验证
  validateForm() {
    if (!this.data.amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return false;
    }
    // 只在支出类型时验证分类
    if (this.data.type === 'expense' && !this.data.selectedCategory) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});
