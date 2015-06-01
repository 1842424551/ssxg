var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var userSchema = new Schema({
	userName: String,
	userPassword: String,
    realName: String,
    phoneNumber: Number,
    email: String,
    identity: String            //该字段如果是普通用户则是'common_user', 如果是管理员则是所属club的id
});

module.exports = mongoose.model("User", userSchema);