import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../../mongo_db/redis.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_KEY, {
    expiresIn: "60m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_KEY, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshTokenInRedis = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token#${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, //xss
    secure: process.env.NODE_ENV === "production", //production => https
    sameSite: "strict", //csrf
    maxAge: 60 * 60 * 1000, // expires in 60 mins
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //xss
    secure: process.env.NODE_ENV === "production", //production => https
    sameSite: "strict", //csrf
    maxAge: 7 * 24 * 60 * 60 * 1000, // expires in 7 days
  });
};
export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists)" });
    }
    const new_user = await User.create({ name, email, password });
    return res.status(201).json({
      new_user: {
        _id: new_user._id,
        name: new_user.name,
        email: new_user.email,
        role: new_user.role,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.log("Error in signup", error.message);
    res.status(500).json({ message: error.message });
  }
  const { accessToken, refreshToken } = generateTokens(new_user._id);
  await storeRefreshTokenInRedis(new_user._id, refreshToken);
  setCookies(res, accessToken, refreshToken);
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.isValidPassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshTokenInRedis(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
      res.json({
        _id: new_user._id,
        name: new_user.name,
        email: new_user.email,
        role: new_user.role,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login", error.message);
    res.status(500).json({ message: error.message });
  }
};

// refresh access token
export const refreshToken = async (redis, res) => {
  const refresh = req.cookies.refreshToken;
  try {
    if (!refresh) {
      return res.status(401).json({ message: "No refresh token provides" });
    }
    const decodes = jwt.verify(refresh, process.env.REFRESH_TOKEN_KEY);
    const redisToken = await redis.get(`refresh_token#${decodes.userId}`);
    //user enters fake refresh token
    if (refresh !== redisToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    // refresh access token
    const accessToken = jwt.sign(
      { userId: decodes.userId },
      process.env.ACCESS_TOKEN_KEY,
      {
        expiresIn: "60m",
      }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true, //xss
      secure: process.env.NODE_ENV === "production", //production => https
      sameSite: "strict", //csrf
      maxAge: 60 * 60 * 1000, // expires in 60 mins
    });
    res.json({ message: "Successfully token refresh" });
  } catch (error) {
    console.log("Error in refreshing the token", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY); // decode refresh
      await redis.del(`refresh_token#${decoded.userId}`); // delete refresh from redis
    }
    res.clearCookie("accessToken"); // clear accessCookie
    res.clearCookie("refreshCookie"); // clear refreshCookie
    res.json({ message: "Successfully logged out" });
  } catch (error) {
    console.log("Error in logout", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
