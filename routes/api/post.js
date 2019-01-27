const Router = require("koa-router");
const passport = require("koa-passport");

const router = new Router();

// 引入模板
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

// 引入验证
const validatePostInput = require("../../validation/post");

/**
 * @route GET api/post/test
 * @desc 测试接口地址
 * @access public
 */
router.get("/test", async ctx => {
  ctx.status = 200;
  ctx.body = { msg: "post works..." };
});

/**
 * @route POST api/post
 * @desc 创建留言接口地址
 * @access private
 */
router.post("/", passport.authenticate("jwt", { session: false }), async ctx => {
  const { errors, isValid } = validatePostInput(ctx.request.body);

  // 判断是否验证通过
  if (!isValid) {
    ctx.status = 400;
    ctx.body = errors;
    return;
  }
  const newPost = new Post({
    text: ctx.request.body.text,
    name: ctx.request.body.name,
    avatar: ctx.request.body.avatar,
    user: ctx.state.user.id
  });
  await newPost
    .save()
    .then(post => (ctx.body = post))
    .catch(err => (ctx.body = err));
});

/**
 * @route GET api/post/all
 * @desc 获取所有留言接口地址
 * @access public
 */
router.get("/all", async ctx => {
  await Post.find()
    .sort({ date: -1 })
    .then(posts => {
      ctx.status = 200;
      ctx.body = posts;
    })
    .catch(err => {
      ctx.status = 404;
      ctx.body = { nopostsfound: "找不到任何留言信息" };
    });
});

/**
 * @route GET api/post？id=xxx
 * @desc 获取所有留言接口地址
 * @access public
 */
router.get("/", async ctx => {
  const id = ctx.query.id;
  await Post.findById(id)
    .then(post => {
      ctx.status = 200;
      ctx.body = post;
    })
    .catch(err => {
      ctx.status = 404;
      ctx.body = { nopostfound: "没有留言信息" };
    });
});

/**
 * @route DELETE api/post?id=xxxx
 * @desc 删除单个留言接口地址
 * @access private
 */
router.delete("/", passport.authenticate("jwt", { session: false }), async ctx => {
  const id = ctx.query.id;
  const profile = await Profile.find({ user: ctx.state.user.id });
  if (profile.length > 0) {
    // 查到此人的留言
    const post = await Post.findById(id);
    // 判断是不是当前用户操作

    if (post.user.toString() !== ctx.state.user.id) {
      ctx.status = 401;
      ctx.body = { noAuthorization: "用户非法操作" };
      return;
    }
    await Post.remove({ _id: id }).then(() => {
      ctx.status = 200;
      ctx.body = { success: true };
    });
  } else {
    ctx.status = 404;
    ctx.body = { error: "个人信息不存在" };
  }
});

/**
 * @route POST api/post/like？id=xxx
 * @desc 点赞接口地址
 * @access private
 */
router.post("/like", passport.authenticate("jwt", { session: false }), async ctx => {
  const id = ctx.query.id;
  // 查询用户信息
  const profile = await Profile.find({ user: ctx.state.user.id });
  if (profile.length > 0) {
    const post = await Post.findById(id);
    const isLike = post.likes.filter(like => like.user.toString() === ctx.state.user.id).length > 0;
    console.log(ctx.state.user.id);
    if (isLike) {
      ctx.status = 400;
      ctx.body = { alreadyliked: "该用户已赞过" };
      return;
    }
    post.likes.unshift({ user: ctx.state.user.id });
    const postUpdate = await Post.findOneAndUpdate({ _id: id }, { $set: post }, { new: true });
    ctx.body = postUpdate;
  } else {
    ctx.status = 404;
    ctx.body = { error: "profile 不存在" };
  }
});

/**
 * @route POST api/post/unlike？id=xxx
 * @desc 点赞接口地址
 * @access private
 */
router.post("/unlike", passport.authenticate("jwt", { session: false }), async ctx => {
  const id = ctx.query.id;
  // 查询用户信息
  const profile = await Profile.find({ user: ctx.state.user.id });
  if (profile.length > 0) {
    const post = await Post.findById(id);
    const isLike = post.likes.filter(like => like.user.toString() === ctx.state.user.id).length == 0;
    console.log(ctx.state.user.id);
    if (isLike) {
      ctx.status = 400;
      ctx.body = { alreadyliked: "该用户没有点赞过" };
      return;
    }
    // 获取要删掉的user id
    const removeIndex = post.likes.map(item => item.user.toString()).indexOf(ctx.state.user.id);
    post.likes.splice(removeIndex, 1);
    const postUpdate = await Post.findOneAndUpdate({ _id: id }, { $set: post }, { new: true });
    ctx.body = postUpdate;
  } else {
    ctx.status = 404;
    ctx.body = { error: "profile 不存在" };
  }
});

module.exports = router.routes();
