const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    news : {
        type:mongoose.Schema.ObjectId,
         ref:'News',
          required:true
    },
    name:{
        type: String,
        required:true,
    },
    email:{
        type:String
    },
    comment:{
        type:String,
        required: true,
        maxlength:1000
    },
    isApproved:{
        type:Boolean,
        default: false
    },
    createdAt:{
        type: Date,
        default:Date.now
    }
})

CommentSchema.index({news:1, isApproved:1})

module.exports = mongoose.model("Comment", CommentSchema);