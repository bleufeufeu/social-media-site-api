require("dotenv").config();

const express = require("express");

const signupRouter = require("./routes/signupRouter");
const loginRouter = require("./routes/loginRouter");
const logoutRouter = require("./routes/logoutRouter");
const usersRouter = require("./routes/usersRouter");
const postsRouter = require("./routes/postsRouter");
const commentsRouter = require("./routes/commentsRouter");
const followRequestRouter = require("./routes/followRequestRouter");
const uploadRouter = require("./routes/uploadRouter");

const app = express();
const cors = require("cors");

const sessionMiddleware = require("./config/expressSession");
const passport = require("./config/passport");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }));

// app.use("/", indexRouter);
app.use("/signup", signupRouter);
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/follow", followRequestRouter);
app.use("/upload", uploadRouter);

app.listen(3000, () => console.log("app listening on port 3000!"));
