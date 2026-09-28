const cron = require('node-cron');
const News = require('../models/News');

// Recalculate trending scores every hour
cron.schedule('0 * * * *', async () => {
  try {
    const news = await News.find({ status: 'published' });
    const updates = news.map(item => {
      item.calculateTrendingScore();
      return item.save();
    });
    await Promise.all(updates);
    console.log(`✅ ${news.length} खबरों का ट्रेंडिंग स्कोर अपडेट हुआ`);
  } catch (err) {
    console.error('Trending cron error:', err);
  }
});

module.exports = cron;
