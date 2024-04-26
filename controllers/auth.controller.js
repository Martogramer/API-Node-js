import bcrypt from "bcrypt";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const passwordHashed = await bcrypt.hash(password, 10); // hash the password
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user!" });
  }

  
};
export const login = (req, res) => {
  console.log("login endpoint");
};
export const logout = (req, res) => {
  console.log("logout endpoint");
};
