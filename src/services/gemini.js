const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({  model : "gemini-2.5-flash", })


//Rewrite news in better context
exports.rewriteNews = async (content) => {
    const prompt = `निम्नलिखित हिंदी समाचार को एक पेशेवर पत्रकार की तरह फिर से लिखें। व्याकरण और वर्तनी सुधारें, भाषा प्रवाहमय बनाएं, और समाचार की मूल जानकारी बनाए रखें। कृपया इसे अच्छी तरह से फॉर्मेट करें: महत्वपूर्ण स्थानों, नामों और मुख्य बातों को **बोल्ड (bold)** करें, और पाठ को 2-3 छोटे पैराग्राफ में विभाजित करें (paragraph spacing) ताकि पढ़ने में आसानी हो। केवल पुनर्लिखित समाचार वापस करें, कोई अतिरिक्त टिप्पणी नहीं:
    ${content}
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
};

//fix grammar and spelling only 

exports.fixGrammar = async (content) => {
    const prompt = `निम्नलिखित हिंदी पाठ में केवल व्याकरण और वर्तनी की गलतियाँ सुधारें। सामग्री और शैली में कोई बदलाव न करें। केवल सुधरा हुआ पाठ वापस करें:
                    ${content}`
    const result = await model.generateContent(prompt);
    return result.response.text()
}

// Generate SEO meta description 

exports.generateMetaDescription = async (title, content) => {
    const prompt = `निम्नलिखित समाचार के लिए एक SEO-अनुकूल मेटा विवरण (अधिकतम 160 अक्षर) हिंदी में लिखें:

शीर्षक: ${title}
सामग्री: ${content.substring(0, 500)}

केवल मेटा विवरण वापस करें:`;

    const result = await model.generateContent(prompt)
    return result.response.text().trim().substring(0,160)

};

//generate tags 

exports.generateTags = async(title, content )=>{
   const prompt = `निम्नलिखित समाचार के लिए 5-8 हिंदी टैग (कीवर्ड) उत्पन्न करें। JSON array format में वापस करें जैसे: ["टैग1", "टैग2"]:

${title}
${content.substring(0, 300)}`; 

    const result = await model.generateContent(prompt);
    try {
         const text = result.response.text().replace(/```json|```/g, '').trim();
         return JSON.parse(text);
    } catch  {
        return []
    }

}

// translate text 

exports.translateContent = async (content, targetLanguage) => {
  const langMap = {
    'chhattisgarhi': 'छत्तीसगढ़ी',
    'english': 'English',
    'hindi': 'हिंदी',
    'marathi': 'मराठी',
    'gujarati': 'ગુजराती'
  };
  const lang = langMap[targetLanguage] || targetLanguage;
  const prompt = `निम्नलिखित पाठ का ${lang} में अनुवाद करें। केवल अनुवाद वापस करें:

${content}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};
