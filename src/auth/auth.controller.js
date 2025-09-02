const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const { createUser, findUserByEmail } = require("../user/user.model");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await findUserByEmail(email);
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await hashPassword(password);
    const user = await createUser(username, email, hashed);
    const token = generateToken(user.userid);

    res.status(201).json({ userId: user.userid, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await comparePassword(password, user.passwordhash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user.userid);
    res.status(200).json({ userId: user.userid, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
