const mongoose = require('mongoose');

const { Schema } = mongoose;
const Feed = new Schema(
  {
    username: { type: String, required: true },
    content: { type: String, required: true, maxlength: 150 },
    image: { type: String },
    job: { type: String },
    like: { type: Array },
    comment: [new mongoose.Schema({ commentId: String, text: String })],
    hashtag: { type: Array },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

exports.Feed = mongoose.model('Feed', Feed);
