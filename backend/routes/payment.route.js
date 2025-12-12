import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    checkoutSuccess,
    createCheckoutSession,
    esewaCheckout,
    verifyEsewaPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post('/esewa-checkout', protectRoute, esewaCheckout);
router.post("/checkout-success", protectRoute, checkoutSuccess);
router.post('/esewa-payment-verification', protectRoute, verifyEsewaPayment);

export default router;