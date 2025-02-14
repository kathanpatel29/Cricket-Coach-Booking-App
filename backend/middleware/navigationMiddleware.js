const generateBreadcrumbs = (req, res, next) => {
  const path = req.path;
  const parts = path.split('/').filter(Boolean);
  
  const breadcrumbs = parts.map((part, index) => {
    const url = '/' + parts.slice(0, index + 1).join('/');
    return {
      label: part.charAt(0).toUpperCase() + part.slice(1),
      url
    };
  });

  req.breadcrumbs = breadcrumbs;
  next();
};

const trackNavigation = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, path, ip } = req;
  
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  
  // Track response time
  const start = process.hrtime();
  
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const responseTime = duration[0] * 1e3 + duration[1] * 1e-6;
    console.log(`[${timestamp}] ${method} ${path} - Response Time: ${responseTime.toFixed(2)}ms`);
  });

  next();
};

module.exports = { generateBreadcrumbs, trackNavigation };