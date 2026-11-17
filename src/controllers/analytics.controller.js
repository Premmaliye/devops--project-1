const store = require('../data/store');

const getAnalytics = (req, res) => {
  const analytics = store.getAnalytics();
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: analytics
  });
};

module.exports = {
  getAnalytics
};

