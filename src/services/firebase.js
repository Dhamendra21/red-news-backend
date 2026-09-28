const admin = require('firebase-admin');

let firebaseApp;

const initFirebase = () => {
    if (!firebaseApp) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
    }
    return admin.messaging(firebaseApp);
};

exports.sendNewsNotification = async (news, tokens) => {
    if (!tokens?.length) return { successCount: 0, failureCount: 0, staleTokens: [] };

    const messaging = initFirebase();
    const result = { successCount: 0, failureCount: 0, staleTokens: [] };
    const data = {
        newsId: news._id.toString(),
        slug: news.slug,
        category: news.category,
        url: `${process.env.FRONTEND_URL}/news/${news.slug}`
    };

    for (let index = 0; index < tokens.length; index += 500) {
        const batch = tokens.slice(index, index + 500);
        const response = await messaging.sendEachForMulticast({
            notification: {
                title: 'RED NEWS BHARAT - नई खबर',
                body: news.title.substring(0, 100)
            },
            data,
            tokens: batch
        });

        result.successCount += response.successCount;
        result.failureCount += response.failureCount;
        response.responses.forEach((item, responseIndex) => {
            if (item.error?.code === 'messaging/registration-token-not-registered' ||
                item.error?.code === 'messaging/invalid-registration-token') {
                result.staleTokens.push(batch[responseIndex]);
            }
        });
    }

    console.log(`${result.successCount} notification(s) sent`);
    return result;
};

exports.subscribeToTopic = async (token, topic) => {
    const messaging = initFirebase();
    return messaging.subscribeToTopic(token, topic);
};

exports.sendTopicNotification = async (topic, title, body, data = {}) => {
    const messaging = initFirebase();
    return messaging.send({ notification: { title, body }, data, topic });
};

// const firebaseConfig = {
//   apiKey: "AIzaSyD0ZXnGob3mx03lN_03YjDWIUmsyk6xdjc",
//   authDomain: "red-news-f6279.firebaseapp.com",
//   projectId: "red-news-f6279",
//   storageBucket: "red-news-f6279.firebasestorage.app",
//   messagingSenderId: "254660746731",
//   appId: "1:254660746731:web:d81bc6ff3a2a62149e4dae",
//   measurementId: "G-GHECRPHH5Z"
// };