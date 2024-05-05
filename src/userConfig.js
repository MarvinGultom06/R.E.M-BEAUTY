const mongoose = require('mongoose');

// Anda dapat menggunakan koneksi yang sama jika sudah terbuka, atau mendefinisikan koneksi baru jika diperlukan
mongoose.connect("mongodb://localhost:27017/Login-nyoba", {
    useNewUrlParser: true,
    useUnifiedTopology: true
        })
    .then(() => console.log("User database connected"))
    .catch(err => console.error("User database connection failed", err));

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const User = mongoose.model("admin", userSchema);

module.exports = User;
