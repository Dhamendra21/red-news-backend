const express = require('express')

const router = express.Router()

const CATEGORIES = [
  { id: 'trending', name: 'ट्रेंडिंग', nameHi: 'ट्रेंडिंग समाचार', icon: '🔥' },
  { id: 'world', name: 'विश्व', nameHi: 'विश्व समाचार', icon: '🌐' },
  { id: 'national', name: 'राष्ट्रीय', nameHi: 'राष्ट्रीय समाचार', icon: '🇮🇳' },
  { id: 'local', name: 'स्थानीय', nameHi: 'जिला/स्थानीय समाचार', icon: '📍' },
  { id: 'sports', name: 'खेल', nameHi: 'खेल समाचार', icon: '⚽' },
  { id: 'science', name: 'विज्ञान', nameHi: 'विज्ञान और नवाचार', icon: '🔬' },
  { id: 'environment', name: 'पर्यावरण', nameHi: 'पर्यावरण समाचार', icon: '🌿' },
  { id: 'reader-news', name: 'पाठक समाचार', nameHi: 'पाठकों की खबरें', icon: '📰' },
  { id: 'politics', name: 'राजनीति', nameHi: 'राजनीति समाचार', icon: '🏛️' },
  { id: 'entertainment', name: 'मनोरंजन', nameHi: 'मनोरंजन समाचार', icon: '🎬' },
  { id: 'technology', name: 'प्रौद्योगिकी', nameHi: 'प्रौद्योगिकी समाचार', icon: '💻' },
  { id: 'health', name: 'स्वास्थ्य', nameHi: 'स्वास्थ्य समाचार', icon: '🏥' },
  { id: 'business', name: 'व्यापार', nameHi: 'व्यापार समाचार', icon: '💼' },
  { id: 'education', name: 'शिक्षा', nameHi: 'शिक्षा समाचार', icon: '📚' },
  { id: 'lifestyle', name: 'जीवनशैली', nameHi: 'जीवनशैली समाचार', icon: '🏠' },
  { id: 'travel', name: 'यात्रा', nameHi: 'यात्रा समाचार', icon: '✈️' },
  { id: 'food', name: 'भोजन', nameHi: 'भोजन समाचार', icon: '🍽️' },
  { id: 'opinion', name: 'राय', nameHi: 'राय और विचार', icon: '💬' }
];

router.get('/', (req,res)=>{
    res.status(200).json({
        success:true,
        data:CATEGORIES
    })
})

module.exports = router