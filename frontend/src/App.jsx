import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import useGetCurrentUser from './hooks/useGetCurrentUser'
import useGetOtherUsers from './hooks/useGetOtherUsers'
import { useSelector } from 'react-redux'
import Home from './pages/Home'
import Profile from './pages/Profile'
import { Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'


function App() {
  useGetCurrentUser();
  useGetOtherUsers();
  const { userdata } = useSelector((state) => state.user);
  const token = localStorage.getItem("token");

  // Show loading only during initial auth check
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  React.useEffect(() => {
    // Once we have userdata or confirm there's no token, initial load is done
    if (userdata || !token) {
      setIsInitialLoad(false);
    }
  }, [userdata, token]);

  if (isInitialLoad && token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/signup" element={!userdata ? <SignUp /> : <Navigate to="/profile" replace />} />
        <Route path="/login" element={!userdata ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/" element={userdata ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={userdata ? <Profile /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App