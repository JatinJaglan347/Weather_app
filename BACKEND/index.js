const express = require("express") ; 
const fs = require("fs") ;
const jwt = require("jsonwebtoken") ;
const cors = require("cors") ;
const data = require("./user.json") ;


const app = express() ;
app.use(cors()) ;
app.use(express.urlencoded({extended:false})) ; 
app.use(express.json()) ; 


// MIDDLEWARE 
const authenticateToken = (req,res,next) => {
    const authHeader = req.headers['authorization'] ; 
    console.log(authHeader) ; 
    const token = authHeader && authHeader.split(' ')[1] ; 
    if(token == null) return res.sendStatus(401) ;

    jwt.verify(token,'THIS IS A SECRET KEY', (err,user) => {
        if(err) res.sendStatus(403) ; 
        else{
            req.user = user ; 
            next() ; 
        }
    });
};

//  -------------------


const axios = require('axios');
const API_KEY = process.env.API_KEY;
app.post("/get", async (req, res) => {
    const { city } = req.body;
    if (!city) {
        return res.status(400).json({ error: "City name is required" });
    }
    try {
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}`;
        
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            axios.get(currentWeatherUrl),
            axios.get(forecastUrl)
        ]);

        const currentWeatherData = currentWeatherResponse.data;
        const forecastData = forecastResponse.data;

        // Extract the relevant data for the next 5 days
        const dailyForecasts = forecastData.list.filter(item => item.dt_txt.includes("12:00:00")); // Filter to get daily forecasts

        // Send the fetched weather data as JSON
        res.json({
            current: currentWeatherData,
            forecast: dailyForecasts
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching weather data" });
    }
});




app.post("/login",(req,res)=>{
    let {email,password} = req.body ;
    let database = data ;
    
    const INDEX = database.findIndex((ele)=>ele.email.toLowerCase() === email.toLowerCase()) ;

    if(INDEX >= 0)  {
        if(database[INDEX].password === password){
            // creating token
            const user = database[INDEX] ; 
            const payload = {
                id: user.id,
                name: user.name , 
                email: user.email
            };
            jwt.sign(payload, 'THIS IS A SECRET KEY', {expiresIn: '1h'}, (err,token)=>{
                if(err) {
                    console.err("ERROR SIGNING TOKEN",err) ; 
                    res.status(500).json({message:"Errir generating token"}) ; 
                }
                else{
                    console.log(`User logged in : ${email}`) ; 
                    res.json({
                        bool:true,
                        explanation:"USER LOGGED IN",
                        token: token 
                    });
                }
            });
            // -----------
        }
        else{
            // wrong password
            res.status(401).json({bool:false,explanation:"WRONG PASSWORD"});  
        }
    }
    else{ // user not found 
        res.status(404).json({bool:false,explanation:"USER NOT FOUND"}); 
    }
});

app.post("/signup",(req,res)=>{
    let {name,email,password} = req.body ; 
    let database = data ; 

    const INDEX = database.findIndex((ele)=>ele.email.toLowerCase() === email.toLowerCase()) ; 

    if(INDEX >= 0){ // user present
        // res.status(409).json({bool:false,explanation:"USER IS ALREADY PRESENT"}) ; // not working
        res.json({bool:false,explanation:"USER IS ALREADY PRESENT"}) ;
    }
    else{ 
        const user = {name,email,password} ; 
        database.push(user) ; 
        fs.writeFile("user.json", JSON.stringify(database), (err)=> {
            if(err) console.log(err) ; 
            else{
                console.log(`NEW USER CREATED : ${email}`) ; 
                res.status(200).json({bool:true,explanation:"USER ADDED SUCCESSFULLY"}) ;
            }
        })
    }
});


// VERIFY TOKEN
app.get('/verify', authenticateToken , (req,res)=> {
    console.log(`Token verified for user : ${req.user.email}`) ; 
    res.json({valid : true}) ; 
});
// LOGOUT
app.post('/logout', authenticateToken , (req,res)=> {
    console.log(`User logged out : ${req.user.email}`) ; 
    res.json({message : 'Logged out successfully'}) ; 
});

const Port = 5500 ; 
app.listen(Port,(err)=>{
    if(err) console.log(err) ; 
    else{
        console.log(`SERVER RUNNING ON PORT : ${Port}`) ;
    }
});