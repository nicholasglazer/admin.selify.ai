import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/CC8585A6D2DD42446C2ECA3CC7143914');

ws.on('open', async () => {
    let msgId = 1;
    
    const send = (method, params = {}) => {
        return new Promise((resolve) => {
            const id = msgId++;
            const handler = (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.id === id) {
                    ws.off('message', handler);
                    resolve(msg);
                }
            };
            ws.on('message', handler);
            ws.send(JSON.stringify({ id, method, params }));
        });
    };
    
    console.log('=== Navigating to 127.0.0.1:5174/temporal ===');
    
    // Navigate to /temporal using 127.0.0.1
    await send('Page.navigate', {
        url: 'http://127.0.0.1:5174/temporal'
    });
    
    // Wait for page to load
    console.log('Waiting for page to load...');
    await new Promise(r => setTimeout(r, 4000));
    
    // Check current URL
    let result = await send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
    });
    console.log('Current URL:', result.result?.result?.value);
    
    // Get page content
    result = await send('Runtime.evaluate', {
        expression: 'document.body.innerText.substring(0, 500)',
        returnByValue: true
    });
    console.log('\nPage content preview:');
    console.log(result.result?.result?.value);
    
    ws.close();
});

ws.on('error', (err) => {
    console.error('WebSocket error:', err);
});
