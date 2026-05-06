const BYTEZ_API_KEY = '89308ab76023754b041df78e08dd15fd';

async function listModels() {
  try {
    const response = await fetch('https://api.bytez.com/models/v2/list/models?task=chat', {
      headers: {
        'Authorization': BYTEZ_API_KEY
      }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
