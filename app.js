const express = require("express");
const app= express();
const usermodel= require("./models/user-model");
const postmodel = require("./models/post");
const path = require("path");
const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { hash } = require("crypto");
const { log } = require("console");

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(cookieparser());

app.get('/',(req,res)=>{
    res.render("index");
})

app.get('/login',(req,res)=>{
    res.render("login");
})

app.get('/profile',isloggedin , async (req,res)=>{
    let user = await usermodel.findOne({email:req.user.email}).populate("posts");
    // console.log(user);
    res.render("profile",{user});
})

app.get('/like/:id',isloggedin , async (req,res)=>{
    let post = await postmodel.findOne({_id:req.params.id}).populate("user");
    // console.log(req.user.userid);
    if(post.likes.indexOf(req.user.userid)=== -1){

        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
        }
    await post.save();
    res.redirect("/profile");
})

app.get('/edit/:id',isloggedin , async (req,res)=>{
    let post = await postmodel.findOne({_id:req.params.id}).populate("user");
    // console.log(req.user.userid);
    res.render("edit",{post});
})

app.post('/update/:id',isloggedin , async (req,res)=>{
    let post = await postmodel.findOneAndUpdate({_id:req.params.id},{postdata: req.body.postdata})
    // console.log(req.user.userid);
    res.redirect("/profile");
})

app.post('/post',isloggedin,async (req,res)=>{
    let user = await usermodel.findOne({email:req.user.email})
    let {postdata} = req.body;

    let post =    await postmodel.create({
            user:user._id,
            postdata,
        })
    // console.log(post);
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");

})

app.post("/register",async (req,res)=>{
    let {name,username,password,email,age} = req.body;

    let user = await usermodel.findOne({email})
    if(user) return res.status(500).send("user already registered");

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            if(err) return res.send("invalid credentials");
          let user = await  usermodel.create({
                name,
                username,
                age,
                email,
                password:hash
            })
            // console.log(hash);
        let token = jwt.sign({email:email,userid:user._id},"secretkey")
        // console.log(token);
        res.cookie("token",token);
        res.redirect("/login");
        })
    })
})

app.post("/login",async (req,res)=>{
    let { email,password} = req.body;

    let user = await usermodel.findOne({email})
    if(!user) return res.status(300).send("something went wrong");

    bcrypt.compare(password,user.password,(err,result)=>{
        if(result) {
        // console.log(result);
        let token = jwt.sign({email:email,userid:user._id},"secretkey")
        // console.log(token);
        res.cookie("token",token);
          res.status(200).redirect('/profile')
        }
       else res.redirect('/login')
    })
})

app.get('/logout',(req,res)=>{
    res.cookie('token',"");
    res.redirect("/login");
})

function isloggedin(req,res,next){
    if(req.cookies.token === ""){
        res.redirect("/login");
    }
    else {
        let data=jwt.verify(req.cookies.token,"secretkey")
        req.user = data;
        next();

    }

}
app.listen(3000);