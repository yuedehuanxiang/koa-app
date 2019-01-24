const Router = require("koa-router");
const bcrypt = require("bcryptjs");

const router = new Router();

// 引入User
const User = require("../../models/User");

/**
 * @route GET api/users/test
 * @desc 测试接口地址
 * @access public
 */
router.get("/test", async ctx => {
  ctx.status = 200;
  ctx.body = { msg: "users works..." };
});

/**
 * @route POST api/users/register
 * @desc 注册接口地址
 * @access private
 */
router.post("/register", async ctx => {
  // console.log(ctx.request.body);
  // 存储到数据库
  const findResult = await User.find({ email: ctx.request.body.email });
  // console.log(findResult);
  if (findResult.length > 0) {
    ctx.status = 500;
    ctx.body = { email: "邮箱已经被占用" };
  } else {
    const newUser = new User({
      name: ctx.request.body.name,
      email: ctx.request.body.email,
      password: ctx.request.body.password
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        // console.log(hash);
        if (err) throw err;
        newUser.password = hash;
      });
    });
    // console.log(newUser);
    // 存储到数据库
    await newUser
      .save()
      .then(user => {
        ctx.body = user;
      })
      .catch(err => {
        console.log(err);
      });
  }
});

module.exports = router.routes();
