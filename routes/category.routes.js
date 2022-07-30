const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");

const CategoryModel = require("../models/Category.model");
const { route } = require("./user.routes");
const UserModel = require("../models/User.model");
const e = require("express");
const TransactionModel = require("../models/Transaction.model");

//CREATE

router.post("/new-category", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  try {
    const newCategory = await CategoryModel.create({
      ...req.body,
      user: loggedInUser._id,
    });
    await UserModel.findOneAndUpdate(
      { _id: loggedInUser._id },
      { $push: { categories: newCategory._id } },
      { new: true }
    );
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

//READ - ALL USER'S CATEGORY

router.get("/categories", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  try {
    const categories = await CategoryModel.find({ user: loggedInUser._id });
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

//READ - CATEGORY DETAILS
router.get("/:categoryId", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  const { categoryId } = req.params;

  try {
    const category = await CategoryModel.findOne({ _id: categoryId });

    if (String(loggedInUser._id) !== String(category.user)) {
      console.log(loggedInUser._id);
      console.log(category.user);
      return res
        .status(401)
        .json({ message: "You are not authorized to view this category." });
    }

    const categoryDetails = await CategoryModel.findOne({
      _id: categoryId,
    }).populate("transactions");
    return res.status(200).json(categoryDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

//READ - SUM OF TRANSACTIONS ON A CATEGORY
// router.get();

//UPDATE CATEGORY
router.patch(
  "/update/:categoryId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    const loggedInUser = req.currentUser;
    const { categoryId } = req.params;
    const body = { ...req.body };
    delete body.transactions;

    try {
      const category = await CategoryModel.findOne({ _id: categoryId });

      if (String(loggedInUser._id) !== String(category.user)) {
        return res
          .status(401)
          .json({ message: "You are not authorized to edit this category." });
      }

      const editedCategory = await CategoryModel.findOneAndUpdate(
        { _id: categoryId },
        { ...body },
        { new: true, runValidators: true }
      );

      return res.status(200).json(editedCategory);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

//DELETE CATEGORY
router.delete(
  "/delete/:categoryId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    const { categoryId } = req.params;
    const loggedInUser = req.currentUser;

    try {
      const category = await CategoryModel.findOne({ _id: categoryId });

      if (!category.user) {
        return res.status(401).json({
          message: "You are not authorized to delete a default category.",
        });
      }

      if (String(loggedInUser._id) !== String(category.user)) {
        return res.status(401).json({
          message: "You are not authorized to delete this transaction.",
        });
      }

      const deletedCategory = await CategoryModel.findOneAndDelete({
        _id: categoryId,
      });

      await TransactionModel.findOneAndUpdate(
        { category: categoryId },
        { category: null },
        { new: true }
      );
      await UserModel.findOneAndUpdate(
        { categories: categoryId },
        { $pull: { categories: categoryId } },
        { new: true }
      );

      return res.status(202).json(deletedCategory);
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
);

module.exports = router;

// GET BANK MODEL
// bankTemplate = await BankModel.find({user: req.current || user: ''})

// bankModel === BankMode que contem CAIO GARCIA ou que nao tenha usuario
