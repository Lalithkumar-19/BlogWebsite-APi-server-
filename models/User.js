const mongoose = require("mongoose");
const { Schema, model } = mongoose;


const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        min: 4,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        min: 4,

    },
    profile: {
        type: String,

    },
    bio: {
        type: String,
        min: 10,
    },
    proffesion: String,

})

const UserModal = model('User', UserSchema);


module.exports = UserModal;