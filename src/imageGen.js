require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

// we can consider adding a .env file to hide this information
const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const testImageGen = async () => {
  console.log('test image generation');
  try {
    const generatedImage = await openai.createImage({
      prompt: 'A drawing of a beautiful landscape',
      n: 1,
      size: '256x256',
      // user: null
    });
    console.log(generatedImage.data);
    return generatedImage.data;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const getImageVariation = async (image) => {
  console.log('image variation');
  const generatedImage = await openai.createImageVariation(
    image,
    1,
    '256x256',
    'url', // 'b64_json'
    // user: null
  );
  return generatedImage.data;
};

module.exports = {
  testImageGen,
  getImageVariation,
};
