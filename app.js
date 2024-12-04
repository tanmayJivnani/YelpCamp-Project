const express = require('express');
const app=express();

const path = require('path');
const mongoose = require('mongoose')

const ExpressError=require('./utils/expressError')
const methodOverride=require("method-override")
const ejsMate=require('ejs-mate')
const session = require('express-session');
const campgrounds=require("./routes/campgrounds")
const reviews=require("./routes/reviews")
const flash = require('connect-flash')

mongoose.connect('mongodb://127.0.0.1:27017/yelpCamp');
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

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!', 
    resave: false,
    saveUninitialized: true, 
    cookie:{
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // a week from now
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use((req, res, next) => {
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
})

app.use('/campgrounds', campgrounds);
app.use('/campgrounds/:id/reviews', reviews);
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

app.listen(3000, ()=>{
    console.log('Listening on Port 3000');
})