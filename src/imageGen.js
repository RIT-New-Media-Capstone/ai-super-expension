const { Configuration, OpenAIApi } = require("openai");

// we can consider adding a .env file to hide this information
const configuration = new Configuration({
    organization: "org-APEBRoYbr5vU8yeKy1kiZFzx",
    apiKey: "",
});
const openai = new OpenAIApi(configuration);

const testImageGen = async () => {
    console.log('test image generation');
    try {
        const generatedImage = await openai.createImage({
            prompt: "A drawing of a beautiful landscape",
            n: 1,
            size: "256x256",
            response_format: 'b64_json',
            //user: null
        });
        console.log(generatedImage.data);
        return generatedImage.data;
    } catch (err) {
        console.log(err);
        return err;
    }
}

const getImageVariation = async (image) => {
    console.log('image variation');
    try {
        const generatedImage = await openai.createImageVariation(
            image,
            1,
            "256x256",
            'url', // 'b64_json'
            //user: null
        );
        console.log(generatedImage.data);
        return generatedImage.data;
    } catch (err) {
        console.log(err);
        return err;
    }
}

module.exports = {
    testImageGen,
    getImageVariation
};