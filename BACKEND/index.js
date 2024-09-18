const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require('axios');
const data = require("./user.json");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const WEATHER_API_KEY = '21671e6c6ef1004d8be5c3a5ab37a01c'; // Your API key
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'; // Updated endpoint

// MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, 'THIS IS A SECRET KEY', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// LOGIN
app.post("/login", (req, res) => {
    let { email, password } = req.body;
    let database = data;

    const INDEX = database.findIndex((ele) => ele.email.toLowerCase() === email.toLowerCase());

    if (INDEX >= 0) {
        if (database[INDEX].password === password) {
            const user = database[INDEX];
            const payload = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            jwt.sign(payload, 'THIS IS A SECRET KEY', { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    console.error("ERROR SIGNING TOKEN", err);
                    res.status(500).json({ message: "Error generating token" });
                } else {
                    console.log(`User logged in : ${email}`);
                    res.json({
                        bool: true,
                        explanation: "USER LOGGED IN",
                        token: token
                    });
                }
            });
        } else {
            res.status(401).json({ bool: false, explanation: "WRONG PASSWORD" });
        }
    } else {
        res.status(404).json({ bool: false, explanation: "USER NOT FOUND" });
    }
});

// SIGNUP
app.post("/signup", (req, res) => {
    let { name, email, password } = req.body;
    let database = data;

    const INDEX = database.findIndex((ele) => ele.email.toLowerCase() === email.toLowerCase());

    if (INDEX >= 0) {
        res.json({ bool: false, explanation: "USER IS ALREADY PRESENT" });
    } else {
        const user = { name, email, password };
        database.push(user);
        fs.writeFile("user.json", JSON.stringify(database), (err) => {
            if (err) console.log(err);
            else {
                console.log(`NEW USER CREATED : ${email}`);
                res.status(200).json({ bool: true, explanation: "USER ADDED SUCCESSFULLY" });
            }
        });
    }
});

// WEATHER DATA ENDPOINT FOR UNAUTHENTICATED USERS (1 day)
app.get('/weather/current', async (req, res) => {
    try {
        const { lat, lon } = req.query;  // Pass latitude and longitude from frontend
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                lat: lat,
                lon: lon,
                appid: WEATHER_API_KEY,
                units: 'metric',  // Use metric units for temperature
                cnt: 1  // Number of days (forecast length) for current weather
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching current weather data:", error.message);
        res.status(500).json({ message: "Error fetching weather data" });
    }
});

// WEATHER DATA ENDPOINT FOR AUTHENTICATED USERS (7 days)
app.get('/weather/forecast', authenticateToken, async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                lat: lat,
                lon: lon,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching forecast weather data:", error.message);
        res.status(500).json({ message: "Error fetching weather data" });
    }
});

// VERIFY TOKEN
app.get('/verify', authenticateToken, (req, res) => {
    res.json({ valid: true });
});

// LOGOUT
app.post('/logout', authenticateToken, (req, res) => {
    console.log(`User logged out : ${req.user.email}`);
    res.json({ message: 'Logged out successfully' });
});

// MIDDLEWARES

// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log error stack for debugging
    res.status(500).json({
        message: 'Login credential are wrong',
        error: err.message,
    });
};

// Unexpected Route Handler Middleware
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        message: 'Route not found',
    });
};

// Place the unexpected route handler after all other routes
app.use(notFoundHandler);

// Place the error handler middleware last, after other app.use() and routes calls
app.use(errorHandler);

// Server setup
const Port = 5500;
app.listen(Port, (err) => {
    if (err) console.log(err);
    else {
        console.log(`SERVER RUNNING ON PORT : ${Port}`);
    }
});
