const mongoose = require('mongoose');

// The URI from the .env file
const uri = 'mongodb+srv://dhmndrsahu:o8YJNVqYgjuyWRnT@cluster0.g4bfe3o.mongodb.net/colors-saptahik';

async function run() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    
    // Execute the user's requested update query
    const result = await db.collection('news').updateMany(
      { thumbnail: { $regex: "^https://ik.imagekit.io/vuh1tlvwk/" } },
      [
        {
          $set: {
            thumbnail: {
              $replaceOne: {
                input: "$thumbnail",
                find: "https://ik.imagekit.io/vuh1tlvwk/rednews_articles/",
                replacement: "https://rednewsbharat.live/uploads/news/"
              }
            }
          }
        }
      ]
    );

    console.log("Update completed successfully!");
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Modified documents: ${result.modifiedCount}`);
  } catch (err) {
    console.error("Error during update:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
