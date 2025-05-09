import { useEffect } from "react";
import { setUser } from "../redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  const { userdata } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // If we already have user data, don't fetch again
        if (userdata) {
          console.log("Already have user data:", userdata);
          return;
        }

        console.log("Fetching current user");
        const response = await axios.get("http://localhost:3000/api/user/current", {
          withCredentials: true, // This is required for cookies to be sent
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Current user response:", response.data);
        
        const userData = response.data.user;
        
        if (userData && Object.keys(userData).length > 0) {
          console.log("Setting user data:", userData);
          dispatch(setUser(userData));
        } else {
          console.log("No user data in response");
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error("Auth error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        dispatch(setUser(null));
      }
    };

    fetchUser();
  }, [dispatch, userdata]);
};

export default useGetCurrentUser;