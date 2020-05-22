const mongoose = require('mongoose');

// 팔로우 정보 collection 'user' collection 의존 
const followInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    require: true
  },
  follow: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    require: true
  },
});

const followInfoModel = mongoose.model('followInfo', followInfoSchema);

module.exports = followInfoModel;
