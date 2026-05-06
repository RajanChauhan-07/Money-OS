const BYTEZ_API_KEY = '89308ab76023754b041df78e08dd15fd';

async function listModels() {
  try {
    // Standard Bytez list models endpoint
    const response = await fetch('https://api.bytez.com/models/v2/list/models?task=chat', {
      headers: {
        'Authorization': BYTEZ_API_KEY
      }
    });
    const data = await response.json();
    console.log('Chat Models:', data.output.slice(0, 10).map(m => m.modelId));
    
    // Check for OpenAI models specifically
    const openaiModels = data.output.filter(m => m.modelId.toLowerCase().includes('openai'));
    console.log('OpenAI Models:', openaiModels.map(m => m.modelId));

    // Check for Anthropic models
    const anthropicModels = data.output.filter(m => m.modelId.toLowerCase().includes('anthropic'));
    console.log('Anthropic Models:', anthropicModels.map(m => m.modelId));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
