require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/db.config")();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.REACT_APP_URL }));

const uploadImgRouter = require("./routes/uploadimg.routes");
app.use("/", uploadImgRouter);

const userRouter = require("./routes/user.routes");
app.use("/user", userRouter);

const categoryRouter = require("./routes/category.routes");
app.use("/category", categoryRouter);

const transactionsRouter = require("./routes/transaction.routes");
app.use("/transaction", transactionsRouter);


const bankRouter = require("./routes/banks.routes");
app.use("/bank", bankRouter)


app.listen(Number(process.env.PORT), () => {
  console.log("Server up at port: ", process.env.PORT);
});
