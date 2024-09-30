import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [city, setCity] = useState('');
  const [cityData, setCityData] = useState({});
  const [forecastData, setForecastData] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [email_L, setLEmail] = useState('');
  const [password_L, setLPassword] = useState('');
  const [showSignupForm, setShowSignupForm] = useState(false); // State for showing signup form
  const [showLoginForm, setShowLoginForm] = useState(false); // State for showing login form

  useEffect(() => {
    checkAuth();
  }, []);

  const updateUIForAuth = (isLoggedIn) => {
    setIsLoggedIn(isLoggedIn);
  };

  const checkAuth = async () => {
    const token = JSON.parse(localStorage.getItem('login'))?.token;
    if (!token) {
      updateUIForAuth(false);
    } else {
      try {
        const response = await axios.get('https://weather-app-backend-ashen-gamma.vercel.app/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        updateUIForAuth(response.data.valid);
      } catch (err) {
        console.error(`ERROR: ${err.message}`);
        updateUIForAuth(false);
      }
    }
  };

  const fetchForecastData = async () => {
    const obj = { city }; // Use the currently set city
    try {
      const response = await axios.post('https://weather-app-backend-ashen-gamma.vercel.app/get', obj);
      if (response.data) {
        const { current, forecast } = response.data;

        const currentWeather = {
          name: current.name,
          temp: `${(current.main.temp - 273.15).toFixed(2)}°C`,
          weather: `${current.weather[0].description}`,
          date: `${new Date(current.dt * 1000).toLocaleDateString()}`,
        };
        setCityData(currentWeather);

        const forecastList = forecast.map((item) => {
          const date = new Date(item.dt * 1000).toLocaleDateString();
          return {
            temp: `${(item.main.temp - 273.15).toFixed(2)}°C`,
            weather: `${item.weather[0].description}`,
            date,
          };
        });
        setForecastData(forecastList);
      } else {
        setCityData('NOTHING TO DISPLAY');
        setForecastData([]);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      alert(`PLEASE ENTER A VALID CITY OR COUNTRY NAME,\n${error.message}`);
      setCityData('NOTHING TO DISPLAY');
      setForecastData([]);
    }
  };

  const handleCity = async (e) => {
    e.preventDefault();
    await fetchForecastData(); // Fetch weather data when submitting the city
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page
    const obj = { name, email, password };
    try {
      const response = await axios.post('https://weather-app-backend-ashen-gamma.vercel.app/signup', obj);
      console.log('Signup response:', response.data); // Log response for debugging
      if (response.data.bool) {
        alert('USER CREATED SUCCESSFULLY! PLEASE LOGIN');
        checkAuth();
        setShowSignupForm(false); // Hide signup form after successful signup
      } else {
        alert('USER ALREADY EXISTS! PLEASE LOGIN');
      }
    } catch (err) {
      console.error(`SIGNUP ERROR: ${err.message}`); // Log error for debugging
      alert('SIGNUP FAILED: ' + err.message); // Alert the error message
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page
    const obj = { email: email_L, password: password_L };
    try {
      const response = await axios.post('https://weather-app-backend-ashen-gamma.vercel.app/login', obj);
      console.log('Login response:', response.data); // Log response for debugging
      if (response.data.bool) {
        alert(response.data.explanation);
        localStorage.setItem(
          'login',
          JSON.stringify({
            login: true,
            token: response.data.token,
          })
        );
        checkAuth(); // Update UI for authenticated user
        setShowLoginForm(false); // Hide login form after successful login
        await fetchForecastData(); // Fetch forecast data after login
      } else {
        alert(response.data.explanation);
      }
    } catch (error) {
      console.error(`LOGIN ERROR: ${error.message}`); // Log error for debugging
      alert('LOGIN FAILED: ' + error.message); // Alert the error message
    }
  };

  const handleLogout = async (e) => {
    try {
      await axios.post(
        'https://weather-app-backend-ashen-gamma.vercel.app/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('login'))?.token}`,
          },
        }
      );
      console.log('LOGOUT REQUEST SENT TO SERVER');
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    } finally {
      localStorage.removeItem('login');
      checkAuth();
      setCityData({}); // Reset city data on logout
      setForecastData([]); // Reset forecast data on logout
    }
  };

  // Functions to show/hide forms
  const showSignup = () => {
    setShowSignupForm(true);
    setShowLoginForm(false); // Hide login form when signup is shown
  };

  const showLogin = () => {
    setShowLoginForm(true);
    setShowSignupForm(false); // Hide signup form when login is shown
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen flex flex-col items-center font-sans p-4">
     <div className="navigation w-full flex justify-between items-center p-4 bg-gray-800 shadow-md rounded-md mb-6">
  <h1 className="text-4xl font-extrabold cursor-pointer hover:text-blue-500 transition" onClick={checkAuth}>
    WeatherApp
  </h1>
  <div className="flex space-x-4">
    {!isLoggedIn && (
      <>
        <button
          className="SIGNUP py-2 px-6 bg-blue-600 rounded-md hover:bg-blue-700 transition"
          onClick={showSignup} // Added onClick to show signup form
        >
          SIGNUP
        </button>
        <button
          className="LOGIN py-2 px-6 bg-green-600 rounded-md hover:bg-green-700 transition"
          onClick={showLogin} // Added onClick to show login form
        >
          LOGIN
        </button>
      </>
    )}
    {isLoggedIn && (
      <button className="LOGOUT py-2 px-6 bg-red-600 rounded-md hover:bg-red-700 transition" onClick={handleLogout}>
        LOGOUT
      </button>
    )}
  </div>
</div>


      <div className="DOM w-full max-w-4xl">
        <div className="box1 bg-gray-800 p-8 rounded-lg shadow-lg">
          <form onSubmit={handleCity} className="form1 flex flex-col items-center space-y-6">
            <input
              type="text"
              className="input1 w-full p-3 rounded bg-gray-700 text-white border-none focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city/country name"
            />
            <button
              type="submit"
              className="button1 py-3 px-6 bg-blue-600 rounded-md hover:bg-blue-700 transition text-lg font-semibold"
            >
              Submit
            </button>
          </form>
          <div className="items_singular mt-6 text-center">
            <h3 className="text-2xl font-semibold">{cityData.name}</h3>
            <h3 className="text-xl mt-2">{cityData.temp}</h3>
            <h3 className="text-lg mt-1 text-gray-400">{cityData.weather}</h3>
            <h3 className="text-lg mt-1 text-gray-400">{cityData.date}</h3>
          </div>
          {!cityData.name ? (
            <div className="X mt-8 text-center text-gray-500">
              <h2 className="text-2xl">NOTHING TO DISPLAY!</h2>
            </div>
          ) : isLoggedIn ? null : (
            <div className="X mt-8 text-center text-gray-500">
              <h2 className="text-xl font-semibold">Forecast Available!</h2>
              <p className="text-lg mt-2">
                To access the weather forecast for the next 5 days, please log in to your account.
              </p>
            </div>
          )}
        </div>

        {/* Conditional rendering for signup and login forms */}
        {showSignupForm && (
          <div className="child1 mt-8 w-full bg-gray-800 p-8 rounded-lg shadow-lg">
            <form onSubmit={handleSignupSubmit} className="formS flex flex-col items-center space-y-6">
              <input
                type="text"
                className="inputS w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
              />
              <input
                type="email"
                className="inputS w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <input
                type="password"
                className="inputS w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button type="submit" className="buttonS py-3 px-6 bg-blue-600 rounded-md hover:bg-blue-700 transition text-lg font-semibold">
                SIGNUP
              </button>
            </form>
          </div>
        )}

        {showLoginForm && (
          <div className="child2 mt-8 w-full bg-gray-800 p-8 rounded-lg shadow-lg">
            <form onSubmit={handleLoginSubmit} className="formL flex flex-col items-center space-y-6">
              <input
                type="email"
                className="inputL w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-green-500 outline-none transition"
                value={email_L}
                onChange={(e) => setLEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <input
                type="password"
                className="inputL w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-green-500 outline-none transition"
                value={password_L}
                onChange={(e) => setLPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button type="submit" className="buttonL py-3 px-6 bg-green-600 rounded-md hover:bg-green-700 transition text-lg font-semibold">
                LOGIN
              </button>
            </form>
          </div>
        )}

        {/* Display the weather forecast after login */}
        {isLoggedIn && forecastData.length > 0 && (
          <div className="forecast mt-8">
            <h2 className="text-2xl text-center font-semibold mb-6">5-Day Weather Forecast</h2>
            <div className="forecastData grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {forecastData.map((item, index) => (
                <div key={index} className="forecastItem bg-gray-700 p-6 rounded-lg text-center shadow-md">
                  <h3 className="text-xl font-semibold mb-2">{item.date}</h3>
                  <h3 className="text-lg">{item.temp}</h3>
                  <h3 className="text-lg text-gray-400">{item.weather}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
