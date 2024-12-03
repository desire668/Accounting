import * as echarts from '../../ec-canvas/echarts';

let monthlyTrendChart = null;

function initMonthlyTrendChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const income = params[0].value;
        const expense = params[1].value;
        return `${params[0].axisValue}\n收入：¥${income}\n支出：¥${expense}`;
      }
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '60rpx',
      top: '30rpx',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value) {
          return '¥' + value;
        }
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: [],
        itemStyle: {
          color: '#07c160'
        }
      },
      {
        name: '支出',
        type: 'line',
        data: [],
        itemStyle: {
          color: '#ff4d4f'
        }
      }
    ]
  };

  chart.setOption(option);
  return chart;
}

Page({
  data: {
    isYearMode: false,
    currentDate: '',
    displayDate: '',
    overview: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00'
    },
    incomeData: [],
    expenseData: []
  },

  onLoad() {
    const now = new Date();
    const currentDate = this.formatDate(now);
    this.setData({
      currentDate,
      displayDate: this.formatDisplayDate(currentDate)
    });
    this.loadStatisticsData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  // 切换到月度视图
  switchToMonth() {
    if (this.data.isYearMode) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentDate = `${year}-${month}`;
      this.setData({
        isYearMode: false,
        currentDate,
        displayDate: `${year}年${month}月`
      });
      this.loadStatisticsData();
    }
  },

  // 切换到年度视图
  switchToYear() {
    if (!this.data.isYearMode) {
      const now = new Date();
      const year = now.getFullYear().toString();
      this.setData({
        isYearMode: true,
        currentDate: year,
        displayDate: `${year}年`
      });
      this.loadStatisticsData();
    }
  },

  // 日期变化处理
  onDateChange(e) {
    const currentDate = e.detail.value;
    let displayDate;
    
    if (this.data.isYearMode) {
      displayDate = `${currentDate}年`;
    } else {
      const [year, month] = currentDate.split('-');
      displayDate = `${year}年${month}月`;
    }

    this.setData({
      currentDate,
      displayDate
    });
    this.loadStatisticsData();
  },

  // 查看收入详细
  showIncomeDetail() {
    if (this.data.isYearMode) {
      wx.showToast({
        title: '请先选择月份',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?type=income&date=${this.data.currentDate}`
    });
  },

  // 查看支出详细
  showExpenseDetail() {
    if (this.data.isYearMode) {
      wx.showToast({
        title: '请先选择月份',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?type=expense&date=${this.data.currentDate}`
    });
  },

  // 加载统计数据
  loadStatisticsData() {
    const records = wx.getStorageSync('records') || [];
    let filteredRecords;

    if (this.data.isYearMode) {
      // 年度模式：只匹配年份
      const year = this.data.currentDate;
      filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear().toString() === year;
      });
    } else {
      // 月度模式：匹配年份和月份
      const [year, month] = this.data.currentDate.split('-');
      filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordYear = recordDate.getFullYear().toString();
        const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0');
        return recordYear === year && recordMonth === month;
      });
    }

    // 计算总收支
    const overview = this.calculateOverview(filteredRecords);
    
    // 计算分类统计
    const { incomeData, expenseData } = this.calculateCategoryData(filteredRecords);

    this.setData({
      overview,
      incomeData,
      expenseData
    });
  },

  // 计算总收支
  calculateOverview(records) {
    const overview = records.reduce((acc, curr) => {
      const amount = parseFloat(curr.amount);
      if (curr.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      return acc;
    }, { income: 0, expense: 0 });

    overview.balance = overview.income - overview.expense;

    return {
      income: overview.income.toFixed(2),
      expense: overview.expense.toFixed(2),
      balance: overview.balance.toFixed(2)
    };
  },

  // 计算分类统计
  calculateCategoryData(records) {
    const incomeMap = new Map();
    const expenseMap = new Map();
    let totalIncome = 0;
    let totalExpense = 0;

    // 统计各分类金额
    records.forEach(record => {
      const amount = parseFloat(record.amount);
      const map = record.type === 'income' ? incomeMap : expenseMap;
      const category = record.category;

      if (!map.has(category.name)) {
        map.set(category.name, {
          name: category.name,
          icon: category.icon,
          amount: 0
        });
      }

      const categoryData = map.get(category.name);
      categoryData.amount += amount;

      if (record.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    // 转换为数组并计算百分比
    const incomeData = Array.from(incomeMap.values()).map(item => ({
      ...item,
      amount: item.amount.toFixed(2),
      percentage: totalIncome ? ((item.amount / totalIncome) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.amount - a.amount);

    const expenseData = Array.from(expenseMap.values()).map(item => ({
      ...item,
      amount: item.amount.toFixed(2),
      percentage: totalExpense ? ((item.amount / totalExpense) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.amount - a.amount);

    return { incomeData, expenseData };
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear().toString();
    if (this.data.isYearMode) {
      return year;
    }
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  },

  // 格式化显示日期
  formatDisplayDate(dateStr) {
    if (this.data.isYearMode) {
      return `${dateStr}年`;
    }
    const [year, month] = dateStr.split('-');
    return `${year}年${month}月`;
  }
}); 