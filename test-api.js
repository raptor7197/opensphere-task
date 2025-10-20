const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing backend API endpoints...');

    // Test root endpoint
    console.log('\n1. Testing root endpoint:');
    const rootResponse = await fetch('http://localhost:3001/');
    const rootData = await rootResponse.json();
    console.log('✅ Root endpoint:', rootData);

    // Test visa data endpoint
    console.log('\n2. Testing visa data endpoint:');
    const visaResponse = await fetch('http://localhost:3001/api/visas');
    const visaData = await visaResponse.json();
    console.log('✅ Visa data endpoint:', Object.keys(visaData));

    // Test health endpoint
    console.log('\n3. Testing health endpoint:');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData);

    console.log('\n🎉 All API endpoints are working correctly!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();