app.get("/search", async (req, res) => {
    console.log("Received search query:", req.query.query);
});
