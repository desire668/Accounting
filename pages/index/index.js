// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    currentMonth: '',
    overview: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00'
    },
    recentRecords: []
  },

  onLoad() {
    this.setCurrentMonth();
    this.loadOverviewData();
    this.loadRecentRecords();
  },

  onShow() {
    this.loadOverviewData();
    this.loadRecentRecords();
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  // 设置当前月份显示
  setCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.setData({
      currentMonth: `${year}年${month}月`
    });
  },

  // 加载概览数据
  loadOverviewData() {
    const records = wx.getStorageSync('records') || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // 计算本月收支
    const monthData = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === currentYear && 
             recordDate.getMonth() + 1 === currentMonth;
    });

    const overview = monthData.reduce((acc, curr) => {
      const amount = parseFloat(curr.amount);
      if (curr.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      return acc;
    }, { income: 0, expense: 0 });

    overview.balance = overview.income - overview.expense;

    this.setData({
      overview: {
        income: overview.income.toFixed(2),
        expense: overview.expense.toFixed(2),
        balance: overview.balance.toFixed(2)
      }
    });
  },

  // 加载最近记录
  loadRecentRecords() {
    const records = wx.getStorageSync('records') || [];
    // 获取最近的5条记录
    const recentRecords = records
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(record => ({
        id: record.id,
        type: record.type,
        category: record.category.name,
        amount: record.amount,
        date: this.formatDate(new Date(record.date)),
        icon: record.category.icon,
        remark: record.remark ? record.remark.slice(0, 4) : '' // 最多显示4个字的备注
      }));

    this.setData({ recentRecords });
  },

  // 添加收入
  onAddIncome() {
    wx.navigateTo({
      url: '/pages/record/record?type=income'
    });
  },

  // 添加支出
  onAddExpense() {
    wx.navigateTo({
      url: '/pages/record/record?type=expense'
    });
  },

  // 格式化日期
  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  }
});
