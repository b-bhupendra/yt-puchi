import https from 'https';

const urls = [
  'https://inv.thepixora.com/api/v1/stats',
  'https://invidious.projectsegfau.lt/api/v1/stats'
];

urls.forEach(url => {
  https.request(url, { method: 'OPTIONS' }, (res) => {
    let headers = res.headers;
    console.log(url + ' CORS: ' + headers['access-control-allow-origin']);
  }).on('error', (e) => console.log(url + ' Error: ' + e.message)).end();
});
