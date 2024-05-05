const express = require("express");
const app = express();
const path = require("path");
const port = 3000;
const bcrypt = require("bcrypt");
const collection = require("./src/config");


app.use(express.json());
app.use(express.urlencoded({extended: true})); // Perubahan untuk menangani data form yang lebih baik
app.set("view engine", "ejs");
app.use(express.static("public"));

let cartItems = []; // Menyimpan item keranjang di memori

// Route untuk menampilkan halaman dan form login/pendaftaran
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/LoginAdmin", (req, res) => res.render("LoginAdmin"));
app.get("/review", (req, res) => res.render("review"));
app.get("/addProduct", (req, res) => res.render("addProduct"));
app.get("/admin", (req, res) => res.render("admin"));



// Handle user registration
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await collection.findOne({ name: username });
    if (existingUser) {
        return res.send(`
            <html>
                <head><title>Sign Up Error</title></head>
                <body>
                    <script>
                        alert("User already exists. Please choose a different username.");
                        window.location.href = "/signup";
                    </script>
                </body>
            </html>
        `);
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await collection.insertMany({ name: username, password: hashedPassword });
    res.render("login");
});

// Handle user login
app.post("/login", async (req, res) => {
    const user = await collection.findOne({ name: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.send(`
        <html>
            <head><title>Login Error</title></head>
            <body>
                <script>
                    alert("Invalid username or password.");
                    window.location.href = "/login";
                </script>
            </body>
        </html>
    `);
    }
    res.render("index");
});

// Routes untuk memanggil produk detail
app.get("/BrowGell-detail", (req, res) => res.render("BrowGell-detail"));

// Simplify similar routes using a pattern (this assumes all detail pages follow a similar naming convention)
const products = ["CalmingFaceMist", "EssentialDrip", "ClassicLipstick", "Concealer", "CoolingBlurringUnderEyeBalm", "EyelinerMarker", "EyeshadowGloss", "EyeshadowPalette", "Foundation", "HighlighterTopper", "HydratingMatteSettingSpray", "Lash&BrowBoostingSerum", "LipBalm", "LunarMagic", "PlumpingLipGloss", "SatinMatteBlush", "ThankuNextlips", "VomulizingMascara", "CoolingMakeupPrepSet"];
products.forEach(product => {
    app.get(`/${product}-detail`, (req, res) => res.render(`${product}-detail`));
});

// Route untuk menambahkan item ke keranjang
const CartItem = require('./src/cart');  // Pastikan path ke file model Anda benar

app.post('/add-to-cart', async (req, res) => {
    const { product, quantity, price, image } = req.body;
    const quantityInt = parseInt(quantity, 10);
    const priceFloat = parseFloat(price);

    try {
        let item = await CartItem.findOne({ product: product });

        if (item) {
            // Jika item sudah ada di keranjang, update kuantitas dan total harga
            item.quantity += quantityInt;
            item.totalPrice = item.quantity * priceFloat;
        } else {
            // Jika item belum ada, buat baru
            item = new CartItem({
                product,
                quantity: quantityInt,
                price: priceFloat,
                totalPrice: quantityInt * priceFloat,
                image
            });
        }

        await item.save();  // Simpan perubahan atau item baru ke database
        res.redirect('/cart');  // Alihkan user ke halaman keranjang
    } catch (err) {
        console.error('Error adding item to cart', err);
        res.status(500).send("Failed to add item to cart.");
    }
    
});

//Route untuk mengupdate produk dalam cart
app.post('/update-cart', async (req, res) => {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
        return res.status(400).send("Quantity must be greater than zero");
    }

    try {
        const item = await CartItem.findById(productId);
        if (!item) {
            return res.status(404).send("Item not found");
        }
        item.quantity = qty;
        item.totalPrice = item.quantity * item.price;
        await item.save();
        res.redirect('/cart');
    } catch (err) {
        console.error('Error updating item in cart', err);
        res.status(500).send("Failed to update item in cart.");
    }
});

// Route untuk menampilkan keranjang
app.get("/cart", async (req, res) => {
    try {
        const cartItems = await CartItem.find({});
        let total = 0;
        cartItems.forEach(item => {
            total += item.totalPrice;  // Asumsi ada field totalPrice yang sudah terhitung
        });
        res.render("cart", { items: cartItems, total: total.toFixed(2) });
    } catch (err) {
        console.error('Error retrieving cart items', err);
        res.status(500).send("Failed to retrieve cart items.");
    }
});


// Route untuk menghapus item dari keranjang
app.post('/remove-from-cart', async (req, res) => {
    const { productId } = req.body;

    try {
        const item = await CartItem.findById(productId);
        if (!item) {
            return res.status(404).send("Item not found");
        }

        if (item.quantity > 1) {
            item.quantity -= 1;
            item.totalPrice = item.quantity * item.price;
            await item.save();
        } else {
            await CartItem.findByIdAndDelete(productId);
        }

        res.redirect('/cart');
    } catch (err) {
        console.error('Error removing item from cart', err);
        res.status(500).send("Failed to remove item from cart.");
    }
});

// Route untuk mencari produk
app.get("/search", (req, res) => {
    let query = req.query.query;
    console.log("Original Query:", query); // Debug: melihat input asli
    // Normalisasi input: menghapus spasi, konversi ke huruf kecil
    query = query.replace(/\s+/g, '').toLowerCase();
    console.log("Normalized Query:", query); // Debug: melihat query setelah normalisasi
    const products = ["calmingfacemist", "essentialdrip", "classiclipstick", "concealer", "coolingblurringundereyebalm", "eyelinermarker", "eyeshadowgloss", "eyeshadowpalette", "foundation", "highlightertopper", "hydratingmattesettingspray", "lash&browboostingserum", "lipbalm", "lunarmagic", "plumpinglipgloss", "satinmatteblush", "thankunextlips", "volumizingmascara", "coolingmakeupprepset", "browgell"];

    // Cari produk yang cocok
    const productFound = products.find(product => product.toLowerCase() === query);
    console.log("Product Found:", productFound); // Debug: melihat produk yang ditemukan

    if (productFound) {
        res.redirect(`/${productFound}-detail`);
    } else {
        res.send(`
            <html>
                <head><title>Search Result</title></head>
                <body>
                    <script>
                        alert("Product not found. Please check your spelling or try another keyword.");
                        window.location.href = "/";
                    </script>
                </body>
            </html>
        `);
    }
});

//route untk mensubcribe dengan email
const Email = require('./src/email');
app.post('/subscribe', async (req, res) => {
    const { email_address } = req.body;
    try {
        const newEmail = new Email({ email: email_address });
        await newEmail.save();
        res.send(`
            <html>
                <head>
                    <title>Subscription Success</title>
                    <script type="text/javascript">
                        alert('Thank you for subscribing! Claim your cuppon!');
                        window.location.href = "/";  
                    </script>
                </head>
                <body>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Subscription error:', error);
        const message = error.code === 11000 ? 'This email is already subscribed.' : 'Failed to subscribe.';
        res.send(`
            <html>
                <head>
                    <title>Subscription Error</title>
                    <script type="text/javascript">
                        alert('${message}');
                        window.history.back();  // Go back to the previous page
                    </script>
                </head>
                <body>
                </body>
            </html>
        `);
    }
});

// Handle admin login
// Simpan username dan password dalam array
const adminCredentials = [
    { username: "Marvin", password: "marvin" },
    { username: "Kent", password: "marvin" }
];

app.post("/admin", async (req, res) => {
    const { username, password } = req.body;
    
    // Cek apakah kombinasi username dan password ada dalam array
    const isValidAdmin = adminCredentials.some(creds => creds.username === username && creds.password === password);

    if (isValidAdmin) {
        res.render("admin");  // Render halaman dashboard admin
    } else {
        res.send(`
            <html>
                <head><title>Admin Login Error</title></head>
                <body>
                    <script>
                        alert("Invalid admin credentials.");
                        window.location.href = "/LoginAdmin";  // Redirect kembali ke halaman login admin
                    </script>
                </body>
            </html>
        `);
    }
});

const User = require("./src/userConfig");

// Route to handle adding new user from admin dashboard
app.post("/add-user", async (req, res) => {
    try {
        const { username, email } = req.body;
        const newUser = new User({ username, email });
        await newUser.save();
        // Mengirimkan respon JSON dengan data pengguna yang berhasil disimpan
        res.json({
            success: true, 
            message: "User added successfully!",
            user: { username, email }
        });
    } catch (error) {
        console.error('Failed to add user:', error);
        // Mengirimkan respon JSON dengan pesan error
        res.status(500).json({
            success: false, 
            message: "Failed to add user",
            error: error.message
        });
    }
});
app.delete('/delete-user', async (req, res) => {
    try {
        const { username } = req.query;  // Menerima username sebagai query parameter
        const result = await User.deleteOne({ username: username });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error('Failed to delete user:', error);
        res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
    }
});

app.get('/get-users', async (req, res) => {
    try {
        const users = await User.find({}); // Misalkan 'User' adalah model Mongoose Anda
        res.json(users);
    } catch (error) {
        console.error('Failed to retrieve users:', error);
        res.status(500).send("Failed to retrieve users.");
    }
});

app.post("/update-user", async (req, res) => {
    try {
        const { oldUsername, newUsername, newEmail } = req.body;
        const user = await User.findOneAndUpdate({ username: oldUsername }, { username: newUsername, email: newEmail }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "User updated successfully", user });
    } catch (error) {
        console.error('Failed to update user:', error);
        res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
    }
});
  
const Review = require('./src/review');  // Pastikan path ke model Review Anda benar

// Route untuk mengambil semua review
app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({});
        res.json(reviews);
    } catch (err) {
        console.error('Error retrieving reviews', err);
        res.status(500).send("Failed to retrieve reviews.");
    }
});

// Route untuk menambahkan review baru
app.post('/review', async (req, res) => {
    const { username, text } = req.body;
    try {
        const newReview = new Review({ username, text });
        const savedReview = await newReview.save();
        res.status(201).json({ id: savedReview._id, text: savedReview.text, username: savedReview.username });
    } catch (err) {
        console.error('Error adding review', err);
        res.status(500).send("Failed to add review.");
    }
});

// Route untuk mengupdate review
app.put('/review/:id', async (req, res) => {
    const { text } = req.body;
    try {
        const updatedReview = await Review.findByIdAndUpdate(req.params.id, { text }, { new: true });
        if (!updatedReview) {
            return res.status(404).send("Review not found.");
        }
        res.send("Review updated successfully.");
    } catch (err) {
        console.error('Error updating review', err);
        res.status(500).send("Failed to update review.");
    }
});

// Route untuk menghapus review
app.delete('/review/:id', async (req, res) => {
    try {
        const result = await Review.findByIdAndDelete(req.params.id);
        if (result) {
            res.send("Review deleted successfully.");
        } else {
            res.status(404).send("Review not found.");
        }
    } catch (err) {
        console.error('Error deleting review', err);
        res.status(500).send("Failed to delete review.");
    }
});

const Product = require('./src/product'); // Adjust the path according to your project structure

app.post('/add-product', (req, res) => {
    console.log(req.body);  // Cetak data yang diterima
    const product = req.body;

    if (!db) {
        return res.status(500).send("Database connection is not established.");
    }

    db.collection("products").insertOne(product, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err);
            res.status(500).send("Error inserting product");
            return;
        }
        console.log('Insert result:', result);
        res.status(200).send("Product added");
    });
});


  
app.listen(port, () => console.log(`Webserver app listening on port ${port}`));
