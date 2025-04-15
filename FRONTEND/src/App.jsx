import { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weatherIcon, setWeatherIcon] = useState('☀️');

  useEffect(() => {
    checkAuth();
  }, []);

  // Update weather icon based on current weather condition
  useEffect(() => {
    if (cityData.weather) {
      const weatherCondition = cityData.weather.toLowerCase();
      if (weatherCondition.includes('cloud')) setWeatherIcon('☁️');
      else if (weatherCondition.includes('rain')) setWeatherIcon('🌧️');
      else if (weatherCondition.includes('snow')) setWeatherIcon('❄️');
      else if (weatherCondition.includes('thunder')) setWeatherIcon('⚡');
      else if (weatherCondition.includes('fog') || weatherCondition.includes('mist')) setWeatherIcon('🌫️');
      else if (weatherCondition.includes('clear')) setWeatherIcon('☀️');
      else setWeatherIcon('🌤️');
    }
  }, [cityData]);

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
    if (!city.trim()) return;
    
    setLoading(true);
    const obj = { city };
    try {
      const response = await axios.post('https://weather-app-backend-ashen-gamma.vercel.app/get', obj);
      if (response.data) {
        const { current, forecast } = response.data;

        const currentWeather = {
          name: current.name,
          temp: `${(current.main.temp - 273.15).toFixed(1)}°C`,
          weather: `${current.weather[0].description}`,
          date: `${new Date(current.dt * 1000).toLocaleDateString()}`,
          humidity: `${current.main.humidity}%`,
          wind: `${current.wind.speed} m/s`,
        };
        setCityData(currentWeather);

        const forecastList = forecast.map((item) => {
          const date = new Date(item.dt * 1000).toLocaleDateString();
          return {
            temp: `${(item.main.temp - 273.15).toFixed(1)}°C`,
            weather: `${item.weather[0].description}`,
            date,
          };
        });
        setForecastData(forecastList);
      } else {
        setCityData({});
        setForecastData([]);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      const errorMessage = `Location not found. Please enter a valid city or country name.`;
      setCityData({});
      setForecastData([]);
      
      // Use a nicer notification instead of alert
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
      notification.textContent = errorMessage;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCity = async (e) => {
    e.preventDefault();
    await fetchForecastData();
  };

  const showNotification = (message, isSuccess = true) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${isSuccess ? 'bg-emerald-600/90' : 'bg-red-600/90'} text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long', false);
      return;
    }
    
    setLoading(true);
    const obj = { name, email, password };
    try {
      const response = await axios.post('https://weather-app-backend-ashen-gamma.vercel.app/signup', obj);
      if (response.data.bool) {
        showNotification('Account created successfully! Please log in.');
        setShowSignupForm(false);
        setShowLoginForm(true);
        setName('');
        setEmail('');
        setPassword('');
      } else {
        showNotification('Email already registered. Please log in instead.', false);
      }
    } catch (err) {
      console.error(`SIGNUP ERROR: ${err.message}`);
      showNotification('Signup failed. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const obj = { email: email_L, password: password_L };
    try {
      const response = await axios.post('https://weather-app-backend-ashen-gamma.vercel.app/login', obj);
      if (response.data.bool) {
        showNotification('Login successful! Welcome back.');
        localStorage.setItem(
          'login',
          JSON.stringify({
            login: true,
            token: response.data.token,
          })
        );
        checkAuth();
        setShowLoginForm(false);
        setLEmail('');
        setLPassword('');
        await fetchForecastData();
      } else {
        showNotification('Invalid email or password. Please try again.', false);
      }
    } catch (error) {
      console.error(`LOGIN ERROR: ${error.message}`);
      showNotification('Login failed. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
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
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    } finally {
      localStorage.removeItem('login');
      checkAuth();
      setCityData({});
      setForecastData([]);
      showNotification('You have been signed out successfully.');
      setLoading(false);
    }
  };

  const showSignup = () => {
    setShowSignupForm(true);
    setShowLoginForm(false);
  };

  const showLogin = () => {
    setShowLoginForm(true);
    setShowSignupForm(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 min-h-screen flex flex-col items-center font-sans p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-teal-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-400"></div>
        </div>
      )}

      {/* Navigation */}
      <div className="navigation w-full flex justify-between items-center p-6 bg-black/70 backdrop-blur-md shadow-xl rounded-xl mb-8 border border-gray-800 z-10">
        <h1 className="text-4xl font-extrabold cursor-pointer hover:text-emerald-400 transition-all flex items-center">
          <span className="text-emerald-400 mr-2 text-5xl">{weatherIcon}</span>
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">SkyView</span>
        </h1>
        
        <div className="flex space-x-4">
          {!isLoggedIn && (
            <>
              <button
                className="py-2 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center"
                onClick={showSignup}
                disabled={loading}
              >
                <span className="mr-1">✨</span> Join Now
              </button>
              <button
                className="py-2 px-6 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center"
                onClick={showLogin}
                disabled={loading}
              >
                <span className="mr-1">🔐</span> Sign In
              </button>
            </>
          )}
          {isLoggedIn && (
            <button 
              className="py-2 px-6 bg-gradient-to-r from-red-700 to-red-900 rounded-lg hover:from-red-800 hover:to-red-950 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center"
              onClick={handleLogout}
              disabled={loading}
            >
              <span className="mr-1">👋</span> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="DOM w-full max-w-4xl z-10">
        {/* Search box with animated border */}
        <div className="box1 bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-800/10 via-teal-800/10 to-emerald-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <form onSubmit={handleCity} className="form1 flex flex-col items-center space-y-6 relative">
            <div className="w-full relative">
              <input
                type="text"
                className="input1 w-full p-4 pl-12 rounded-xl bg-black/40 text-white border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-lg"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Search city or country"
                disabled={loading}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">🔍</div>
            </div>
            <button
              type="submit"
              className="button1 py-4 px-8 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all transform hover:scale-105 shadow-lg text-lg font-semibold relative overflow-hidden"
              disabled={loading || !city.trim()}
            >
              <span className="relative z-10">Get Weather</span>
              <div className="absolute inset-0 bg-white/10 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300"></div>
            </button>
          </form>
          
          {cityData.name && (
            <div className="items_singular mt-8 text-center bg-gradient-to-b from-black/70 to-gray-900/60 p-8 rounded-xl border border-gray-800 transform transition-all hover:scale-102 hover:border-emerald-800">
              <div className="flex items-center justify-center mb-4">
                <span className="text-6xl">{weatherIcon}</span>
              </div>
              <h3 className="text-3xl font-bold text-emerald-400">{cityData.name}</h3>
              <h3 className="text-5xl mt-4 font-bold">{cityData.temp}</h3>
              <h3 className="text-xl mt-2 text-gray-300 capitalize">{cityData.weather}</h3>
              <h3 className="text-lg mt-2 text-gray-400">{cityData.date}</h3>
              
              {cityData.humidity && (
                <div className="flex justify-center gap-8 mt-6 text-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 mb-1">💧</span>
                    <span className="text-gray-400">Humidity</span>
                    <span className="text-lg font-semibold text-gray-200">{cityData.humidity}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 mb-1">💨</span>
                    <span className="text-gray-400">Wind</span>
                    <span className="text-lg font-semibold text-gray-200">{cityData.wind}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!cityData.name ? (
            <div className="X mt-8 text-center text-gray-400 bg-black/40 p-10 rounded-xl border border-gray-800">
              <div className="text-6xl mb-4">🌤️</div>
              <h2 className="text-2xl font-semibold text-gray-200">Enter a location to see the weather</h2>
              <p className="text-gray-500 mt-2">Search for any city or country to get started</p>
            </div>
          ) : isLoggedIn ? null : (
            <div className="X mt-8 text-center bg-gradient-to-r from-gray-900/80 to-black/80 p-6 rounded-xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-800/20 to-teal-800/20 rounded-bl-full blur-md"></div>
              <h2 className="text-xl font-semibold text-emerald-400">✨ 5-Day Forecast Available!</h2>
              <p className="text-lg mt-2 text-gray-300">
                Sign in to your account to unlock the extended weather forecast.
              </p>
              <button onClick={showLogin} className="mt-4 py-2 px-6 bg-black/40 hover:bg-black/60 rounded-lg transition-all text-gray-200 font-medium">
                Sign In Now
              </button>
            </div>
          )}
        </div>

        {/* Signup form with enhanced design */}
        {showSignupForm && (
          <div className="child1 mt-8 w-full bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800/10 rounded-bl-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-800/10 rounded-tr-full blur-xl"></div>
            
            <h2 className="text-2xl font-bold text-center mb-6 text-emerald-400">Create Your Account</h2>
            <form onSubmit={handleSignupSubmit} className="formS flex flex-col items-center space-y-6 relative">
              <div className="w-full relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500/70">👤</span>
                <input
                  type="text"
                  className="inputS w-full p-4 pl-12 rounded-xl bg-black/40 text-white border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>
              
              <div className="w-full relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500/70">✉️</span>
                <input
                  type="email"
                  className="inputS w-full p-4 pl-12 rounded-xl bg-black/40 text-white border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
              </div>
              
              <div className="w-full relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500/70">🔒</span>
                <input
                  type="password"
                  className="inputS w-full p-4 pl-12 rounded-xl bg-black/40 text-white border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password (min 6 characters)"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="buttonS w-full py-4 px-8 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all transform hover:scale-105 shadow-lg text-lg font-semibold disabled:opacity-70"
                disabled={loading || !name || !email || password.length < 6}
              >
                Create Account
              </button>
              
              <p className="text-gray-400 text-center">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={showLogin} 
                  className="text-emerald-400 hover:text-emerald-300 transition-colors underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </div>
        )}

        {/* Login form with enhanced design */}
        {showLoginForm && (
          <div className="child2 mt-8 w-full bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gray-800/50 rounded-br-full blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gray-800/50 rounded-tl-full blur-xl"></div>
            
            <h2 className="text-2xl font-bold text-center mb-6 text-emerald-400">Welcome Back</h2>
            <form onSubmit={handleLoginSubmit} className="formL flex flex-col items-center space-y-6 relative">
              <div className="w-full relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500/70">✉️</span>
                <input
                  type="email"
                  className="inputL w-full p-4 pl-12 rounded-xl bg-black/40 text-white border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  value={email_L}
                  onChange={(e) => setLEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
              </div>
              
              <div className="w-full relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500/70">🔒</span>
                <input
                  type="password"
                  className="inputL w-full p-4 pl-12 rounded-xl bg-black/40 text-white border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  value={password_L}
                  onChange={(e) => setLPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="buttonL w-full py-4 px-8 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all transform hover:scale-105 shadow-lg text-lg font-semibold disabled:opacity-70"
                disabled={loading || !email_L || !password_L}
              >
                Sign In
              </button>
              
              <p className="text-gray-400 text-center">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={showSignup} 
                  className="text-emerald-400 hover:text-emerald-300 transition-colors underline"
                >
                  Create one
                </button>
              </p>
            </form>
          </div>
        )}

        {/* Enhanced forecast display */}
        {isLoggedIn && forecastData.length > 0 && (
          <div className="forecast mt-8 bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-800/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-800/10 rounded-full blur-xl"></div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-10 h-1 bg-gradient-to-r from-emerald-500 to-transparent rounded-full mr-2"></div>
              <h2 className="text-2xl font-bold text-center text-emerald-400">5-Day Weather Forecast</h2>
              <div className="w-10 h-1 bg-gradient-to-l from-emerald-500 to-transparent rounded-full ml-2"></div>
            </div>
            
            <div className="forecastData grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {forecastData.map((item, index) => {
                // Determine weather icon based on forecast
                let icon = '☀️';
                if (item.weather.includes('cloud')) icon = '☁️';
                else if (item.weather.includes('rain')) icon = '🌧️';
                else if (item.weather.includes('snow')) icon = '❄️';
                else if (item.weather.includes('thunder')) icon = '⚡';
                else if (item.weather.includes('fog') || item.weather.includes('mist')) icon = '🌫️';
                else if (item.weather.includes('clear')) icon = '☀️';
                
                return (
                  <div 
                    key={index} 
                    className="forecastItem bg-gradient-to-b from-black/60 to-gray-900/40 p-6 rounded-xl text-center shadow-lg border border-gray-800 hover:border-emerald-800 transition-all transform hover:scale-105 hover:bg-black/50"
                  >
                    <h3 className="text-xl font-bold mb-2 text-emerald-400">{item.date}</h3>
                    <div className="text-4xl my-3">{icon}</div>
                    <h3 className="text-2xl font-bold text-gray-100">{item.temp}</h3>
                    <h3 className="text-sm text-gray-400 mt-2 capitalize">{item.weather}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced footer */}
      <footer className="mt-12 text-gray-400 text-center w-full max-w-4xl bg-black/60 p-4 rounded-xl backdrop-blur-sm border border-gray-800 z-10">
        <div className="flex items-center justify-center mb-2">
          {['☀️', '🌧️', '⚡', '❄️', '🌈'].map((emoji, index) => (
            <span key={index} className="mx-1 animate-pulse" style={{animationDelay: `${index * 0.2}s`}}>{emoji}</span>
          ))}
        </div>
        <p>SkyView Weather App © 2025 | Stay ahead of the weather</p>
      </footer>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}

export default App;