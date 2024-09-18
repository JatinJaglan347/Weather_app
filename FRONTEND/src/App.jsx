// App.js

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import {
  WiDaySunny,
  WiRain,
  WiSnow,
  WiThunderstorm,
  WiCloudy,
  WiFog,
} from 'react-icons/wi';
import {
  FaUserPlus,
  FaSignInAlt,
  FaSignOutAlt,
} from 'react-icons/fa'; // Icons for authentication

// Set the app element for accessibility
Modal.setAppElement('#root');

// Mapping weather descriptions to icons
const weatherIconMap = {
  clear: <WiDaySunny size={48} />,
  rain: <WiRain size={48} />,
  snow: <WiSnow size={48} />,
  thunderstorm: <WiThunderstorm size={48} />,
  cloudy: <WiCloudy size={48} />,
  fog: <WiFog size={48} />,
};

function App() {
  // State variables
  const [weatherData, setWeatherData] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Authentication form states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State variables for user's location
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Effect to check authentication and fetch weather data on mount
  useEffect(() => {
    checkAuth();
    getUserLocation();
    // eslint-disable-next-line
  }, []);

  // Function to check user authentication
  const checkAuth = async () => {
    const token = JSON.parse(localStorage.getItem('login'))?.token;
    if (!token) {
      updateUIForAuth(false);
    } else {
      try {
        const response = await axios.get('http://localhost:5500/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.valid) {
          updateUIForAuth(true);
        } else {
          updateUIForAuth(false);
        }
      } catch (err) {
        console.error(`ERROR: ${err.message}`);
        updateUIForAuth(false);
      }
    }
  };

  // Function to get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          console.error(`Geolocation Error: ${error.message}`);
          setLocationError('Unable to retrieve your location. Showing weather for default location.');
          // Optionally, set default coordinates if user denies access
          setLatitude('37.7749'); // Default to San Francisco
          setLongitude('-122.4194');
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLocationError('Geolocation is not supported by your browser.');
      // Optionally, set default coordinates
      setLatitude('37.7749'); // Default to San Francisco
      setLongitude('-122.4194');
    }
  };

  // Effect to fetch weather data when latitude and longitude are set
  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
    }
    // eslint-disable-next-line
  }, [latitude, longitude]);

  // Function to fetch weather data
  const fetchWeatherData = async (lat, lon) => {
    const token = JSON.parse(localStorage.getItem('login'))?.token;
    try {
      const endpoint = token
        ? 'http://localhost:5500/weather/forecast'
        : 'http://localhost:5500/weather/current';
      const response = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          lat: lat,
          lon: lon,
        },
      });

      // Format dates
      const formattedData = response.data.list.map((day) => {
        const date = new Date(day.dt * 1000); // Assuming 'dt' is the timestamp in seconds
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(undefined, options);
        return { ...day, date: formattedDate };
      });

      // Remove duplicate dates
      const uniqueDates = Array.from(
        new Set(formattedData.map((day) => day.date))
      ).map((date) => {
        return formattedData.find((day) => day.date === date);
      });

      setWeatherData(uniqueDates);
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      setLocationError('Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  // Function to update UI based on authentication status
  const updateUIForAuth = (status) => {
    setIsLoggedIn(status);
  };

  // Function to handle signup form submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const obj = { name: signupName, email: signupEmail, password: signupPassword };
    try {
      const response = await axios.post('http://localhost:5500/signup', obj);
      if (response.data.bool) {
        alert('User created successfully! Please login.');
        closeSignupModal();
      } else {
        alert('User already exists! Please login.');
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      alert('An error occurred during signup.');
    }
  };

  // Function to handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const obj = { email: loginEmail, password: loginPassword };
    try {
      const response = await axios.post('http://localhost:5500/login', obj);
      if (response.data.bool) {
        alert(response.data.explanation);
        localStorage.setItem(
          'login',
          JSON.stringify({
            login: true,
            token: response.data.token,
          })
        );
        updateUIForAuth(true);
        fetchWeatherData(latitude, longitude); // Refetch weather data after login
        closeLoginModal();
      } else {
        alert(response.data.explanation);
      }
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      alert('An error occurred during login.');
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5500/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('login'))?.token}`,
          },
        }
      );
      console.log('Logout request sent to server');
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    } finally {
      localStorage.removeItem('login');
      updateUIForAuth(false);
      setWeatherData([]); // Clear weather data on logout
    }
  };

  // Modal handlers
  const openSignupModal = () => setIsSignupModalOpen(true);
  const closeSignupModal = () => setIsSignupModalOpen(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Function to get appropriate weather icon
  const getWeatherIcon = (weather) => {
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('clear')) return weatherIconMap.clear;
    if (weatherLower.includes('rain')) return weatherIconMap.rain;
    if (weatherLower.includes('snow')) return weatherIconMap.snow;
    if (weatherLower.includes('storm')) return weatherIconMap.thunderstorm;
    if (weatherLower.includes('cloud')) return weatherIconMap.cloudy;
    if (weatherLower.includes('fog')) return weatherIconMap.fog;
    return <WiCloudy size={48} />; // Default icon
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-gray-100 min-h-screen flex flex-col">
      <div className='fixed z-20 justify-center items-center w-full flex flex-col mt-16 md:mt-0'>
      {/* Warning Banner */}
      {locationError && (
              <div className="bg-yellow-500 bg-opacity-80 p-2 text-center text-sm ">
                {locationError}
              </div>
            )}
            {!locationError && latitude && longitude && (
              <div className="bg-green-500 bg-opacity-80 p-2 text-center text-sm  ">
                Weather data is being displayed based on your live location.
              </div>
            )}

      </div>
      
      {/* Header */}
      <header className="bg-gray-800 bg-opacity-80 shadow-md fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h1 className="text-3xl font-bold">Weather App</h1>
          <div className="space-x-2 flex">
            {!isLoggedIn && (
              <>
                <button
                  onClick={openSignupModal}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center transition"
                >
                  <FaUserPlus className="mr-2" /> Signup
                </button>
                <button
                  onClick={openLoginModal}
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded flex items-center transition"
                >
                  <FaSignInAlt className="mr-2" /> Login
                </button>
              </>
            )}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded flex items-center transition"
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto mt-24 p-4 flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          </div>
        ) : (
          <>
            {/* Current Weather */}
            {weatherData.length > 0 && (
              <section className="mb-8">
                <div className="bg-gray-800 bg-opacity-70 p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center">
                  {getWeatherIcon(weatherData[0].weather[0].description)}
                  <div className="ml-0 md:ml-6 mt-4 md:mt-0 text-center md:text-left">
                    <h2 className="text-2xl font-semibold">Today</h2>
                    <p className="text-xl">{weatherData[0].weather[0].description}</p>
                    <p className="text-4xl font-bold">{weatherData[0].main.temp}°C</p>
                    <p>Humidity: {weatherData[0].main.humidity}%</p>
                    <p>Wind Speed: {weatherData[0].wind.speed} m/s</p>
                  </div>
                </div>
              </section>
            )}

            {/* 6-Day Forecast */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6-Day Forecast</h2>
              {isLoggedIn ? (
                weatherData.length > 1 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {weatherData.slice(1, 7).map((day, index) => (
                      <div
                        key={index}
                        className="bg-gray-800 bg-opacity-70 p-4 rounded-lg shadow-lg flex flex-col items-center"
                      >
                        {getWeatherIcon(day.weather[0].description)}
                        <h3 className="text-xl font-semibold mt-2">{day.date}</h3>
                        <p className="text-lg">{day.weather[0].description}</p>
                        <p className="text-2xl font-bold">{day.main.temp}°C</p>
                        <p>Humidity: {day.main.humidity}%</p>
                        <p>Wind: {day.wind.speed} m/s</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center">No forecast data available.</p>
                )
              ) : (
                <div className="bg-yellow-500 bg-opacity-80 p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">Login Required</h3>
                  <p className="mb-4">
                    To see the weather forecast for the next 5 days, please log in.
                  </p>
                  <button
                    onClick={openLoginModal}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center justify-center mx-auto"
                  >
                    <FaSignInAlt className="mr-2" /> Login
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Signup Modal */}
      <Modal
        isOpen={isSignupModalOpen}
        onRequestClose={closeSignupModal}
        contentLabel="Signup"
        className="max-w-md mx-auto mt-20 bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-lg outline-none text-gray-100"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start"
      >
        <h2 className="text-2xl font-semibold mb-4">Signup</h2>
        <form onSubmit={handleSignupSubmit}>
          <label className="block mb-2">Name</label>
          <input
            type="text"
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            required
            className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded"
          />

          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            required
            className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded"
          />

          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            required
            className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded text-gray-100 font-semibold transition flex items-center justify-center"
          >
            <FaUserPlus className="inline-block mr-2" />
            Sign Up
          </button>
        </form>
        <button
          onClick={closeSignupModal}
          className="mt-4 text-red-500 hover:text-red-600"
        >
          Close
        </button>
      </Modal>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onRequestClose={closeLoginModal}
        contentLabel="Login"
        className="max-w-md mx-auto mt-20 bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-lg outline-none text-gray-100"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start"
      >
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        <form onSubmit={handleLoginSubmit}>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded"
          />

          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded"
          />

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 p-2 rounded text-gray-100 font-semibold transition flex items-center justify-center"
          >
            <FaSignInAlt className="inline-block mr-2" />
            Login
          </button>
        </form>
        <button
          onClick={closeLoginModal}
          className="mt-4 text-red-500 hover:text-red-600"
        >
          Close
        </button>
      </Modal>

      {/* Loader Styles */}
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
