const http = require('http');

http.get('http://150.109.15.108:3010', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body (first 1000 chars):', data.substring(0, 1000));
  });
}).on('error', (err) => {
  console.error('Error fetching from VPS frontend:', err.message);
});
