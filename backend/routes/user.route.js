import express from "express";
import { getUser, getOtherUser, setProfilePic } from "../controllers/user.controller.js";
import isAuth  from "../middlewares/isauth.js";
import upload from "../middlewares/upload.js";

const UserRouter = express.Router();

UserRouter.get("/current", isAuth, getUser);
UserRouter.get("/others", isAuth, getOtherUser);
UserRouter.post("/setprofilepic", isAuth, upload.single('profilePic'), setProfilePic);

export default UserRouter;
