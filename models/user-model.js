const mongoose =require("mongoose")

mongoose.connect("mongodb://0.0.0.0/miniproject");

var userSchema= mongoose.Schema({
    name:String,
    username:String,
    email:String,
    age:Number,
    password:String,
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"post"
        }
    ]
  
})

module.exports = mongoose.model("user",userSchema);
