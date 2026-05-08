const fetch = require('node-fetch');
const GEMINI_API_KEY = 'AIzaSyAtg7BIAtMln0xtt4OJg1P6UYGhvo6sXEE';

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

listModels();
