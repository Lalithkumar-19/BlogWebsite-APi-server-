const express = require("express");
const cors = require("cors")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookie_parser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require("fs");
const post = require("./models/Post");
const secret = process.env.SECRET_PIN;
const port = 2000;
mongoose.set('strictQuery', false)
const User = require("./models/User");
require("dotenv").config();
const salt = bcrypt.genSaltSync(10);



const app = express();
app.use(cors({ credentials: true, origin:["https://blogin-web.netlify.app","http://localhost:5173"] }));
app.use(express.json());
app.use(cookie_parser());
app.use('/uploads', express.static(__dirname + "/uploads"))
mongoose.connect(process.env.MONGO_URL).then( () => console.log("connected to database successfully!"))


app.get("/", async(req, res) => {
    const users = await User.find();
    res.send(users)
})




app.post('/register', async(req, res) => {
    console.log(req.body);
    const { username, password } = req.body;
    try {
        const UserDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(UserDoc)

    } catch (error) {
        // next(error);
        res.status(400).json(error.message);

    }



});



app.post("/login", async(req, res) => {
    const { username, password } = req.body;
    try {
        const UserDoc = await User.findOne({ username });
        const passok = bcrypt.compareSync(password, UserDoc.password);
        if (passok) {
            //logged in
            jwt.sign({ username, id: UserDoc._id }, secret, {}, (err, token) => {
                if (err) {
                    throw err;
                    res.status(400).json('wrong password entered');
                } else {
                    res.status(200).cookie('token', token).json({
                        id: UserDoc._id,
                        username: username,

                    });
                }

            });

        } else {
            res.status(400).json('wrong password entered');

        }

    } catch (err) {
        res.status(400).json("wrong credentials used to login!!")
    }

});












app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });

});

app.post('/logout', (req, res) => {
    res.cookie('token', "").json("okk");


})


app.post('/post', uploadMiddleware.single('file'), async(req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');

    const ext = parts[parts.length - 1];

    const newpath = path + "." + ext
    fs.renameSync(path, newpath);
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body
        const postdoc = await post.create({
            title,
            summary,
            content,
            cover: newpath,
            author: info.id,



        })

        res.json(postdoc);
    })

})

app.put('/post', uploadMiddleware.single('file'), async(req, res) => {
    let newpath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');

        const ext = parts[parts.length - 1];

        newpath = path + "." + ext
        fs.renameSync(path, newpath);
    }
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
        const { id, title, summary, content } = req.body;
        const postdoc = await post.findById(id);
        const isAuthor = JSON.stringify(postdoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            res.status(400).json("your are not author ")
        }
        await postdoc.update({
            title,
            summary,
            content,
            cover: newpath ? newpath : postdoc.cover,

        })



        res.json(postdoc);
    });



});






app.get("/post", async(req, res) => {
    res.json(await post.find()
        .populate('author', ['username'])
        .sort({ createdAt: -1 })
        .limit(20)

    )

})








app.get("/post/:id", async(req, res) => {
    const { id } = req.params;
    const postdoc = await post.findById(id).populate('author');

    res.json(postdoc);


    
})



app.listen(2000, () => console.log(`connected to ${port}`))
