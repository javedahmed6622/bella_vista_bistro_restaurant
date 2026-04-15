const http = require('http');

const data = JSON.stringify({
  title: 'test',
  content: 'test content',
  imageUrl: '',
  imageFilename: ''
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/content/blog-posts-public',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log('status', res.statusCode);
  res.setEncoding('utf8');
  res.on('data', d => process.stdout.write(d));
});

req.on('error', e => console.error('req err', e));
req.write(data);
req.end();
