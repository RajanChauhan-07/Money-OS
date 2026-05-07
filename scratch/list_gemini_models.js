const GEMINI_API_KEY = 'AIzaSyAtg7BIAtMln0xtt4OJg1P6UYGhvo6sXEE';

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
