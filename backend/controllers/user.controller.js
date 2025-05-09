import User from "../models/user.model.js";

import dotenv from "dotenv";
dotenv.config();

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({user});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
}

export const getOtherUser = async (req, res) => {
    try {
        let user = await User.find({
            _id:{
                $ne:req.user.userId
            }
        }).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({user});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
}

export const setProfilePic = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        // Cloudinary automatically provides the full URL in req.file.path
        user.profilePic = req.file.path;
        await user.save();
        res.status(200).json({user});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
}