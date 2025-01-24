import jwt from "jsonwebtoken";
import User from "../backend/models/user.model.js";

export const protectedRoutes = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const decodedToken = jwt.verify(accessToken.env.ACCESS_TOKEN_KEY);
      const user = await User.findById(decodedToken.userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized, Token Ecpired" });
      } else {
        throw error; // goes to the next catch block
      }
    }
  } catch (error) {
    console.log("Error in user auth middleware", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const adminRoutes = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access Denied" });
  }
};
