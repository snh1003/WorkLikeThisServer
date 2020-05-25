const mongoose = require('mongoose');

const { Schema } = mongoose;
const hashTag = new Schema(
  {
    hashtag: { type: String },
  },
  {
    versionKey: false,
  },
);
hashTag.index({ hashtag: 'text' });
exports.Hash = mongoose.model('hashtag', hashTag);
