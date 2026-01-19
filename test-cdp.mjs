import WebSocket from 'ws';
import fs from 'fs';
import http from 'http';

async function main() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
  
  const tab = tabs.find(t => t.url.includes('dash.selify.ai'));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let msgId = 1;
  
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const timeout = setTimeout(() => {
        ws.off('message', handler);
        reject(new Error('Timeout for ' + method));
      }, 20000);
      
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          clearTimeout(timeout);
          ws.off('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  
  await send('Page.enable');
  await send('Runtime.enable');
  
  // Get current URL
  const { result: url } = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Current URL:', url.value);
  
  // Get page content
  const { result: content } = await send('Runtime.evaluate', { 
    expression: 'document.body.innerText.substring(0, 800)',
    returnByValue: true
  });
  console.log('\nPage content:\n', content.value);
  
  // Take screenshot
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/tmp/claude/-home-ng-prod/pm-current.png', Buffer.from(data, 'base64'));
  console.log('\nScreenshot: pm-current.png');
  
  ws.close();
  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
