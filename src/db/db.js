const mongoose = require('mongoose');
const dns = require('dns');


const connectDB = async () => {
    dns.setServers(["8.8.8.8"]);
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB initial connection error:', error);
    }
};

mongoose.connection.on('error', err => {
    console.error('MongoDB runtime connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

module.exports = connectDB;