const { Schema, model, Types } = require("mongoose");

const TransactionSchema = new Schema({
  date: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, trim: true, default: 0 },
  category: { type: Types.ObjectId, ref: "Category" },
  user: { type: Types.ObjectId, ref: "User" },
});

const TransactionModel = model("Transactions", TransactionSchema);

module.exports = TransactionModel;
