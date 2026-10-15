const schools = ['重庆邮电大学', '重庆工商大学'];
const seedBooks = [
  { id: 1, title: '高等数学（上册）', price: 18, condition: '九成新', school: '重庆邮电大学', campus: '南山校区', seller: '林同学', phone: '138****2048', note: '有少量笔记，适合重邮理工科同学。' },
  { id: 2, title: 'Java编程思想', price: 35, condition: '八成新', school: '重庆邮电大学', campus: '南山校区', seller: '周老师', phone: '139****5206', note: '封面有使用痕迹，内页完整。' },
  { id: 3, title: '经济学原理', price: 22, condition: '九成新', school: '重庆工商大学', campus: '江北校区', seller: '小陈', phone: '136****8121', note: '没有划线，面交地点可协商。' }
];
App({
  globalData: { schools, books: wx.getStorageSync('books') || seedBooks, orders: wx.getStorageSync('orders') || [], school: wx.getStorageSync('school') || schools[0], phone: wx.getStorageSync('phone') || '' },
  saveData() { wx.setStorageSync('books', this.globalData.books); wx.setStorageSync('orders', this.globalData.orders); },
  ensureLogin() { if (this.globalData.phone) return true; wx.showModal({ title: '需要登录', content: '请先到“我的”页面完成模拟手机号登录。', showCancel: false }); return false; },
  createOrder(book) { if (!this.ensureLogin()) return; const order = { id: Date.now(), title: book.title, school: book.school, seller: book.seller, phone: book.phone, amount: book.price, fee: +(book.price * 0.15).toFixed(2), sellerIncome: +(book.price * 0.85).toFixed(2), status: '待面交' }; this.globalData.orders.unshift(order); this.saveData(); wx.showModal({ title: '模拟支付成功', content: `订单金额：¥${order.amount.toFixed(2)}\n平台服务费：¥${order.fee.toFixed(2)}\n卖家预计到账：¥${order.sellerIncome.toFixed(2)}`, showCancel: false, success: () => wx.switchTab({ url: '/pages/orders/orders' }) }); }
});
