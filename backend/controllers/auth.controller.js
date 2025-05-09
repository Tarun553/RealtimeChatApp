
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";
export const signUp = async (req, res) => {
   try {
    const {name, username, email, password} = req.body;
    if(!name || !username || !email || !password){
        return res.status(400).json({message: "All fields are required"});
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({message: "User already exists"});
    }
    if(password.length < 6){
        return res.status(400).json({message: "Password must be at least 6 characters long"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({name, username, email, password: hashedPassword});
    const token = await genToken(newUser._id);
    res.cookie("token", token, {httpOnly: true, secure: false, sameSite: "strict", maxAge: 24 * 60 * 60 * 1000});
    res.status(201).json({message: "User created successfully", token, user: newUser});
   } catch (error) {
    console.log(error);
    res.status(500).json({message: "Internal server error"});
   }
}

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "User not found"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }
        const token = await genToken(user._id);
        res.cookie("token", token, {httpOnly: true, secure: false, sameSite: "strict", maxAge: 24 * 60 * 60 * 1000});
        res.status(200).json({message: "User signed in successfully", token, user});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
}


export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({message: "User logged out successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
}



