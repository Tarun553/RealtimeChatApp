import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isAuth = (req, res, next) => {
   try {
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message: "Unauthorized"});
    }
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();    
   } catch (error) {
    console.log(error);
    res.status(500).json({message: "Internal server error"});
   }
}

export default isAuth;
