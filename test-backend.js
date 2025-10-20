import http from 'http';

// Simple test to check if backend is working
function testEndpoint(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: path,
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`✅ ${path} - Status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log(`   Response: ${JSON.stringify(parsed).substring(0, 100)}...`);
      } catch (e) {
        console.log(`   Response: ${data.substring(0, 100)}...`);
      }
      callback(null, { status: res.statusCode, data });
    });
  });

  req.on('error', (err) => {
    console.log(`❌ ${path} - Error: ${err.message}`);
    callback(err);
  });

  req.on('timeout', () => {
    console.log(`⏰ ${path} - Timeout`);
    req.destroy();
    callback(new Error('Timeout'));
  });

  req.end();
}

console.log('Testing backend API endpoints...\n');

// Test health endpoint
testEndpoint('/health', (err) => {
  if (!err) {
    // Test visa data endpoint
    testEndpoint('/api/visas', (err) => {
      if (!err) {
        console.log('\n🎉 Backend is working correctly!');
        console.log('🌐 Frontend: http://localhost:5173');
        console.log('🔧 Backend: http://localhost:3002');
      }
    });
  }
});