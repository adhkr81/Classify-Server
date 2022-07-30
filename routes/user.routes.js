const router = require("express").Router();
const bcrypt = require("bcrypt");
const UserModel = require("../models/User.model");
const BankModel = require("../models/Bank.model");
const CategoryModel = require("../models/Category.model");
const generateToken = require("../config/jwt.config");
const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");
const isAdmin = require("../middlewares/isAdmin");

const saltRounds = 10;

router.post("/signup", async (req, res) => {
  try {
    // Primeira coisa: Criptografar a senha!

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        msg: "Password is required and must have at least 8 characters, uppercase and lowercase letters, numbers and special characters.",
      });
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    const createdUser = await UserModel.create({
      ...req.body,
      passwordHash: passwordHash,
    });

    delete createdUser._doc.passwordHash;

    const defaultBanks = await BankModel.find({ user: null });

    const defaultCategories = await CategoryModel.find({ user: null });
    let copyDefaultCategories = [];
    for (let i = 0; i < defaultCategories.length; i++) {
      copyDefaultCategories.push(
        await CategoryModel.create({
          code: defaultCategories[i].code,
          description: defaultCategories[i].description,
          user: createdUser._id,
        })
      );
    }

    console.log(defaultBanks);
    console.log(defaultCategories);
    await UserModel.findOneAndUpdate(
      { _id: createdUser._id },
      { banks: defaultBanks, categories: copyDefaultCategories },
      { new: true }
    );

    return res.status(201).json(createdUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email: email });
    //ADD userisActive === True (If isActive = FALSE mudar para TRUE)
    if (!user) {
      return res.status(400).json({ msg: "Primeira msg" });
    }

    if (await bcrypt.compare(password, user.passwordHash)) {
      delete user._doc.passwordHash;
      const token = generateToken(user);

      return res.status(200).json({
        token: token,
        user: { ...user._doc },
      });
    } else {
      return res.status(400).json({ msg: "Wrong password or email." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.get("/profile", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;

  const user = await UserModel.findOne({ _id: loggedInUser._id })
    .populate("categories")
    .populate("transactions")
    .populate("banks");
  return res.status(200).json(user);
});

router.patch("/update-profile", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedInUser = req.currentUser;

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: loggedInUser._id },
      { ...req.body },
      { runValidators: true, new: true }
    );

    delete updatedUser._doc.passwordHash;

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

//SOFT DELETE
//ADD HARD DELETE
router.delete(
  "/disable-profile",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const disabledUser = await UserModel.findOneAndUpdate(
        { _id: req.currentUser._id },
        { isActive: false, disabledOn: Date.now() },
        { runValidators: true, new: true }
      );

      delete disabledUser._doc.passwordHash;

      return res.status(200).json(disabledUser);
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
);

module.exports = router;
