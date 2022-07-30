const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");
const UserModel = require("../models/User.model");
const CategoryModel = require("../models/Category.model");
const TransactionModel = require("../models/Transaction.model");

//Create

router.post("/new-transaction", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  const categoryId = req.body.category;

  try {
    const newTransaction = await TransactionModel.create({
      ...req.body,
      user: loggedInUser._id,
    });
    await UserModel.findOneAndUpdate(
      { _id: loggedInUser },
      { $push: { transactions: newTransaction._id } },
      { new: true }
    );
    if (categoryId) {
      await CategoryModel.findOneAndUpdate(
        { _id: categoryId },
        { $push: { transactions: newTransaction._id } },
        { new: true }
      );
    }
    return res.status(201).json(newTransaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

// Read - All

router.get("/transactions", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  try {
    const transactions = await TransactionModel.find({
      user: loggedInUser._id,
    });
    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

//READ - DETAILS
router.get("/:transactionId", isAuth, attachCurrentUser, async (req, res) => {
  const loggedInUser = req.currentUser;
  const { transactionId } = req.params;
  try {
    const transaction = await TransactionModel.findOne({ _id: transactionId });
    if (String(loggedInUser._id) !== String(transaction.user)) {
      return res
        .status(401)
        .json({ message: "You are not authorized to view this transaction." });
    }
    const transactionDetails = await TransactionModel.findOne({
      _id: transactionId,
    }).populate("categories");
    return res.status(200).json(transactionDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

//UPDATE
/*
router.patch(
  "/update/:transactionId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    const loggedInUser = req.currentUser;
    const { transactionId } = req.params;
    const body = { ...req.body };

    // delete body.categories;

    try {
      const transaction = await TransactionModel.findOne({
        _id: transactionId,
      });

      if (String(loggedInUser._id) !== String(transaction.user)) {
        console.log(loggedInUser._id);
        console.log(transaction.user);
        return res.status(401).json({
          message: "You are not authorized to edit this transaction.",
        });
      }

      const editedTransaction = await TransactionModel.findOneAndUpdate(
        { _id: transactionId },
        { ...body },
        { new: true, runValidators: true }
      );

      return res.status(200).json(editedTransaction);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);
*/

//Update transaction-category

router.patch("/categorize", isAuth, attachCurrentUser, async (req, res) => {
  const body = { ...req.body };
  const { categoryId, transactionId } = body;
  const loggedInUser = req.currentUser;

  console.log(req.body);

  try {
    const transaction = await TransactionModel.findOne({
      _id: transactionId,
    });

    if (String(loggedInUser._id) !== String(transaction.user)) {
      return res.status(401).json({
        message: "You are not authorized to edit this transaction.",
      });
    }

    //Editando transação
    const editedTransaction = await TransactionModel.findOneAndUpdate(
      { _id: transactionId },
      { ...body },
      { new: true }
    );

    //Removendo Transação de sua última categoria
    await CategoryModel.findOneAndUpdate(
      { transactions: transactionId },
      { $pull: { transactions: transactionId } },
      { new: true }
    );

    //Adicionando Transação a nova Categoria
    const editedCategory = await CategoryModel.findOneAndUpdate(
      { _id: categoryId },
      { $push: { transactions: transactionId } },
      { new: true }
    );

    return res.status(201).json({ editedTransaction, editedCategory });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

router.delete("/delete/:transactionId", isAuth, attachCurrentUser, async (req, res) => {
  const body = req.body;
  const { transactionId } = req.params;
  const loggedInUser = req.currentUser;
  console.log(transactionId)

  try {
    const transaction = await TransactionModel.findOne({ _id: transactionId });

    if (String(loggedInUser._id) !== String(transaction.user)) {
      return res.status(401).json({
        message: "You are not authorized to delete this transaction.",
      });
    }

    const deletedTransaction = await TransactionModel.findOneAndDelete({
      _id: transactionId,
    });

    await CategoryModel.findOneAndUpdate(
      { transactions: transactionId },
      { $pull: { transactions: transactionId } },
      { new: true }
    );

    await UserModel.findOneAndUpdate(
      { transactions: transactionId },
      { $pull: { transactions: transactionId } },
      { new: true }
    );

    return res.status(202).json(deletedTransaction);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

module.exports = router;
