const mongoose = require('mongoose');

const { Schema } = mongoose;
const Feed = new Schema(
  {
    userId: { type: String, required: true },
    content: { type: String, required: true, maxlength: 150 },
    image: { type: String },
    like: { type: Array },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
exports.Feed = mongoose.model('Feed', Feed);
