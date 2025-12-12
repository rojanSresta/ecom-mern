import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import { useEffect, useState } from "react";
import { MoveRight } from "lucide-react";

const stripePromise = loadStripe(
  "pk_test_51SDQwfBYalDNr4p41ung5kOqlYjBE4WsQTZMl6vAJAtd1YdcZ07HTvB3q7BxlcF8QHsPPItqjorynD1jViGWPmEH00C2O6iZxV"
);

const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [esewa, setesewa] = useState({});

  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);

  useEffect(() => {
    if (esewa.payment) {
      document.getElementById("auto-submit")?.click();
    }
  }, [esewa]);

  const handlePayment = () => {
    setShowPaymentOptions(true);
  };

  const handleEsewaPayment = async () => {
    setShowPaymentOptions(false);

    const res = await axios.post("/payments/esewa-checkout", {
      products: cart,
      couponCode: coupon ? coupon.code : null,
    });

    setesewa({ data: res.data, payment: true });
  };

  const handleStripePayment = async () => {
    setShowPaymentOptions(false);
    const stripe = await stripePromise;
    const res = await axios.post("/payments/create-checkout-session", {
      products: cart,
      couponCode: coupon ? coupon.code : null,
    });

    const session = res.data;
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error("Error:", result.error);
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-emerald-400">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">
              Original price
            </dt>
            <dd className="text-base font-medium text-white">
              ${formattedSubtotal}
            </dd>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">Savings</dt>
              <dd className="text-base font-medium text-emerald-400">
                -${formattedSavings}
              </dd>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">
                Coupon ({coupon.code})
              </dt>
              <dd className="text-base font-medium text-emerald-400">
                -{coupon.discountPercentage}%
              </dd>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4 border-t border-gray-600 pt-2">
            <dt className="text-base font-bold text-white">Total</dt>
            <dd className="text-base font-bold text-emerald-400">
              ${formattedTotal}
            </dd>
          </dl>
        </div>

        <div className="relative">
          <motion.button
            className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePayment}
          >
            Proceed to Checkout
          </motion.button>

          <AnimatePresence>
            {showPaymentOptions && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white rounded-xl p-6 shadow-lg w-80"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <h2 className="text-lg font-semibold mb-4 text-center">
                    Choose Payment Method
                  </h2>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleEsewaPayment}
                      className="w-full rounded-lg bg-green-500 text-white py-2 font-medium hover:bg-green-600"
                    >
                      Pay with eSewa
                    </button>
                    <button
                      onClick={handleStripePayment}
                      className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700"
                    >
                      Pay with Card
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPaymentOptions(false)}
                    className="mt-4 text-sm text-gray-500 w-full text-center hover:underline"
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {esewa.payment && (
          <form
            action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
            method="POST"
          >
            <input type="hidden" name="amount" value={esewa.data.amount} />

            <input type="hidden" name="tax_amount" value="0" />
            <input
              type="hidden"
              name="total_amount"
              value={esewa.data.total_amount}
            />

            <input
              type="hidden"
              name="transaction_uuid"
              value={esewa.data.uid}
            />

            <input type="hidden" name="product_code" value="EPAYTEST" />

            <input type="hidden" name="product_service_charge" value="0" />
            <input type="hidden" name="product_delivery_charge" value="0" />

            <input
              type="hidden"
              name="success_url"
              value={esewa.data.success_url}
            />
            <input
              type="hidden"
              name="failure_url"
              value={esewa.data.failure_url}
            />

            <input
              type="hidden"
              name="signed_field_names"
              value="total_amount,transaction_uuid,product_code"
            />

            <input
              type="hidden"
              name="signature"
              value={esewa.data.signature}
            />

            <button type="submit" className="hidden" id="auto-submit">
              Submit
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
export default OrderSummary;
