import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkoutSuccess, createCheckoutSession, esweaCheckout } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post('/esewa-checkout', protectRoute, esweaCheckout);
router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
