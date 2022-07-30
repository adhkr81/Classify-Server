const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");
const UserModel = require("../models/User.model");
const BankModel = require("../models/Bank.model");

router.post("/custom-bank", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  try {
    const newBankModel = await BankModel.create({
      ...req.body,
      user: loggedInUser._id,
    });

    await UserModel.findOneAndUpdate(
      { _id: loggedInUser },
      { $push: { banks: newBankModel._id } },
      { new: true }
    );

    return res.status(201).json(newBankModel);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

router.get("/bank-model", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;

  try {
    const bankTemplate = await BankModel.find({
      $or: [{ user: loggedInUser._id }, { user: null }],
    });

    return res.status(200).json(bankTemplate);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error finding Bank Models Collection" });
  }
});

router.get("/:bankId", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  const { bankId } = req.params;

  try {
    const bank = await BankModel.findOne({ _id: bankId });

    if (String(loggedInUser._id) !== String(bank.user) && bank.user) {
      return res
        .status(401)
        .json({ message: "You are not authorized to view this CSV template." });
    }

    const bankDetails = await BankModel.findOne({
      _id: bankId,
    }).populate("user");
    return res.status(200).json(bankDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Cannot view this Bank Model" });
  }
});

router.patch(
  "/update-bank/:bankId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    const body = { ...req.body };
    const { bankId } = req.params;
    const loggedInUser = req.currentUser;
    const { userId } = loggedInUser._id;

    try {
      const bank = await BankModel.findOne({
        _id: bankId,
      });

      if (!bank.user) {
        return res.status(401).json({
          message: "You are not authorized to edit a default template.",
        });
      }
      if (String(loggedInUser._id) !== String(bank.user)) {
        return res.status(401).json({
          message: "You are not authorized to edit this bank.",
        });
      }

      const editedBank = await BankModel.findOneAndUpdate(
        { _id: bankId },
        { ...body },
        { new: true }
      );

      return res.status(201).json({ editedBank });
    } catch (error) {
      console.log(error);
      return res.status(500).json(err);
    }
  }
);

router.delete(
  "/delete/:bankId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    const { bankId } = req.params;
    const loggedInUser = req.currentUser;

    try {
      const bank = await BankModel.findOne({ _id: bankId });

      if (!bank.user) {
        return res.status(401).json({
          message: "You are not authorized to delete a default template.",
        });
      }

      if (String(loggedInUser._id) !== String(bank.user)) {
        return res.status(401).json({
          message: "You are not authorized to delete this bank.",
        });
      }

      const deletedbank = await BankModel.findOneAndDelete({
        _id: bankId,
      });

      await UserModel.findOneAndUpdate(
        { banks: bankId },
        { $pull: { banks: bankId } },
        { new: true }
      );

      return res.status(202).json(deletedbank);
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
);

module.exports = router;
