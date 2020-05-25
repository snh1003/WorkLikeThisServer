/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 이메일 유효성 검사
const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// user 스키마 작성
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
      validate: [validateEmail, 'validation failed'],
    },
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    userImage: {
      type: String,
      default: '',
    },
    job: {
      type: String,
    },
    hashtag: [String],
    from: {
      type: String,
      require: true,
      default: 'local' 
    },
    createdAt: {
      type: String,
      default: Date.now(),
    },
    loginAt: {
      type: String,
      default: Date.now(),
    },
  },
  {
    versionKey: false,
  }
);

// 패스워드 유효성 검사(저장 전)
userSchema.pre('save', function (next) {
  const user = this;
  console.log(user.from);
  if (user.from === 'local') {
    if (!user.isModified('password')) return next();
    if (user.password.trim().length < 8) return next();

    bcrypt.genSalt(10, function (err, salt) {
      if (err) return next(err);
      bcrypt.hash(user.password.trim(), salt, function (e, hash) {
        if (e) return next(e);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

// 해싱된 패스워드 비교 커스텀 함수
userSchema.methods.comparePassword = function (checkPassword, cb) {
  bcrypt.compare(checkPassword, this.password, function (err, isEqual) {
    if (err) return cb(err);
    cb(null, isEqual);
  });
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
