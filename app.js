if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express = require('express');
const app=express();
const port = process.env.PORT || 4000;
const path = require('path');
const mongoose = require('mongoose')
const ExpressError=require('./utils/expressError')
const methodOverride=require("method-override")
const ejsMate=require('ejs-mate')
const session = require('express-session');
const campgroundRoutes=require("./routes/campgrounds")
const reviewRoutes=require("./routes/reviews")
const userRoutes=require("./routes/users")
const flash = require('connect-flash')
const passport=require('passport')
const LocalStrategy = require('passport-local');
const User=require('./models/user')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')

const MongoStore = require('connect-mongo');


const dbUrl = process.env.DB_URL;
 //'mongodb://127.0.0.1:27017/yelpCamp'
mongoose.connect(dbUrl);
const db=mongoose.connection
db.on('error', console.error.bind(console, "Connection Error: "))
db.once('open', ()=>{
    console.log(`Database ${db.name} Connected!`);
})

//SET
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
//USE
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))
app.use(mongoSanitize())
app.use(helmet())

//HELMET
const scriptSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net/",
    "https://cdn.maptiler.com/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://cdn.jsdelivr.net/",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://cdn.maptiler.com/"
];
const connectSrcUrls = [
    "https://api.maptiler.com/", // add this
];

const fontSrcUrls = [
    "https://cdn.jsdelivr.net/",
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dndlqml2w/", 
                "https://images.unsplash.com",
                "https://api.maptiler.com/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});


const sessionConfig = {
    store,
    name: 'random',
    secret, 
    resave: false,
    saveUninitialized: true, 
    cookie:{
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // a week from now
        httpOnly: true, 
        // secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser=req.user;
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);
app.use(express.static(path.join(__dirname, 'public')))

// ROUTES
app.get('/', (req,res) => {
    res.render('home')
})

app.all('*', (req,res,next)=>{
    next(new ExpressError('Page Not Found!',400))
})
app.use((err, req, res, next)=>{
    const {statusCode = 500}=err;
    if(!err.message) err.message="Something went Wrong duh!";
    res.status(statusCode).render('error', {err});
})

    


app.listen(port, ()=>{
    console.log(`Listening on Port ${port}`);
})
