const express = require("express");
const router = express.Router();




const userRoutes = require("./Routes/userRoutes");
const adminRoutes = require("./Routes/adminRoutes");



router.use("/users", userRoutes);
router.use("/admins", adminRoutes);


module.exports = router;
