const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2');
const Feed = new Schema(
    {
        userId:{ type : String, required : true },
        content:{ type: String, required: true, maxlength: 150},
        image:{type : String},
        like:{type: Array}
    },
    {
        timestamps: true,
        versionKey: false
    }
)
Feed.plugin(mongoosePaginate)
exports.Feed = mongoose.model('Feed', Feed)