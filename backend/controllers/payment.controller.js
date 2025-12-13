import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

export const esewaCheckout = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    const uid = uuidv4();

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let total_amount_num = 0;

    products.forEach((product) => {
      const subtotal = Number(product.price) * Number(product.quantity || 1);
      total_amount_num += subtotal;
    });

    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (coupon) {
        total_amount_num -= Math.round(
          (total_amount_num * coupon.discountPercentage) / 100
        );
      }
    }

    if (total_amount_num > 2000) {
      await createNewCoupon(req.user._id);
    }

    const total_amount = Number(total_amount_num).toFixed(2);
    const amount = total_amount;

    const message = `total_amount=${total_amount},transaction_uuid=${uid},product_code=EPAYTEST`;

    const hash = CryptoJS.HmacSHA256(message, process.env.ESEWASECRET);
    const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

    res.status(200).json({
      amount,
      total_amount,
      uid,
      success_url: `${process.env.CLIENT_URL}/purchase-success`,
      failure_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      signature: hashInBase64,
    });
  } catch (error) {
    console.log("Error during eswea checkout: ", error);
    res
      .status(500)
      .json({ message: "Error during esewa checkout", error: error.message });
  }
};

export const verifyEsewaPayment = async (req, res) => {
  try {
	const encoded = req.body.data;
	
	if(!encoded) return res.status(400).json({ error: "Missing data parameter" });

    const jsonString = Buffer.from(encoded, "base64").toString("utf-8");
    const paymentData = JSON.parse(jsonString);
	
    const {
      transaction_code,
      status,
      signed_field_names,
      transaction_uuid,
      total_amount,
      product_code,
      signature,
    } = paymentData;

    const message = `transaction_code=${transaction_code},status=${status},total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code},signed_field_names=${signed_field_names}`;

    const hash = CryptoJS.HmacSHA256(message, process.env.ESEWASECRET);
    const generatedSignature = CryptoJS.enc.Base64.stringify(hash);

    if (signature !== generatedSignature) {
      res.status(400).json({ error: "Invalid Signature" });
    }

    if (status !== "COMPLETE") {
      res
        .status(200)
        .json({ message: `Payment not complete (status: ${status})` });
    }

    const userId = paymentData.userId || req.body.userId;
    const products = paymentData.products || req.body.products;

    if (!userId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Missing order information" });
    }

    const newOrder = new Order({
      user: userId,
      products: products.map((p) => ({
        product: p.id || p._id || p.product,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: Number(total_amount),
      esewaTransactionId: transaction_code || transaction_uuid,
      esewaRawResponse: paymentData,
    });

    await newOrder.save();

    return res.status(200).json({
      message: "Payment Verified Successfully and order created.",
      orderId: newOrder._id,
    });
  } catch (e) {
    console.error("Error verifying signature:", e);
    res.status(500).json({ error: "Internal Server Error at verifySignature" });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }

      // create a new Order
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100, // convert from cents to dollars,
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    res.status(500).json({
      message: "Error processing successful checkout",
      error: error.message,
    });
  }
};

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });

  return coupon.id;
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({ userId });

  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId: userId,
  });

  await newCoupon.save();

  return newCoupon;
}
