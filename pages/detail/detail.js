Page({
  data: {
    type: 'expense',
    date: '',
    displayDate: '',
    records: []
  },

  onLoad(options) {
    const { type, date } = options;
    const [year, month] = date.split('-');
    this.setData({
      type,
      date,
      displayDate: `${year}年${month}月`
    });
    this.loadRecords();
  },

  // 加载记录
  loadRecords() {
    const records = wx.getStorageSync('records') || [];
    const [year, month] = this.data.date.split('-');
    
    // 筛选指定月份和类型的记录
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      const recordYear = recordDate.getFullYear().toString();
      const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0');
      return recordYear === year && 
             recordMonth === month && 
             record.type === this.data.type;
    }).map(record => ({
      ...record,
      displayDate: this.formatDate(new Date(record.date))
    }));

    // 按日期降序排序(新的在前)
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    this.setData({ records: filteredRecords });
  },

  // 格式化日期显示
  formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  }
});
