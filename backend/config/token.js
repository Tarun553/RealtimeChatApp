import jwt from "jsonwebtoken";

const genToken = async(userId) => {
    try {
        const token = await jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "1d"});
        return token;
    } catch (error) {
        console.log(error);
        throw new Error("Failed to generate token");
    }
}

export default genToken;
