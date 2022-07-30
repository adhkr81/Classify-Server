const { Schema, model, default: mongoose, Types } = require("mongoose");

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    //match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  },
  passwordHash: { type: String, required: true },
  transactions: [{ type: Types.ObjectId, ref: "Transactions" }],
  categories: [{ type: Types.ObjectId, ref: "Category" }],
  banks: [{ type: Types.ObjectId, ref: "Bank" }],
});

const UserModel = model("User", userSchema);

module.exports = UserModel;
