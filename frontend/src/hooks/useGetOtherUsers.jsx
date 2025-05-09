import { useEffect } from "react";
import { setOtherUsers } from "../redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const useGetOtherUsers = () => {
  const dispatch = useDispatch();
  const { userdata } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        // Only fetch other users if we have our own user data
        if (!userdata) {
          console.log("No current user data, skipping other users fetch");
          return;
        }

        console.log("Fetching other users");
        const response = await axios.get("http://localhost:3000/api/user/others", {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Other users response:", response.data);
        
        if (response.data?.user && Array.isArray(response.data.user)) {
          // Transform users into a more useful format for the chat interface
          const formattedUsers = response.data.user.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            online: false, // We'll update this with socket.io later
            lastMessage: "", // We'll update this when we implement chat history
            lastMessageTime: null,
            unreadCount: 0
          }));
          
          console.log("Setting other users:", formattedUsers);
          dispatch(setOtherUsers(formattedUsers));
        } else {
          console.log("No valid user data in response");
          dispatch(setOtherUsers([]));
        }
      } catch (error) {
        console.error("Error fetching other users:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        dispatch(setOtherUsers([]));
      }
    };

    fetchOtherUsers();
  }, [dispatch, userdata]);
};

export default useGetOtherUsers;