const startPayment = async () => {
  const amount = cart.lineItems?.reduce((total, item) => {
    return total + item.price.amount * item.quantity;
  }, 0);

  try {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });

    const order = await res.json();
    if (!order?.id) throw new Error('Order creation failed');

    openRazorpay(order.id, amount);
  } catch (err) {
    console.error('Payment error:', err);
    alert('Something went wrong during checkout.');
  }
};

const openRazorpay = (orderId, amount) => {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: "INR",
    name: "Athami Fashion",
    description: "Order Payment",
    order_id: orderId,
    handler: function (response) {
      alert("✅ Payment successful!");
      console.log(response);
      // Optionally: update backend order status here
    },
    prefill: {
      name: "Customer Name",
      email: "customer@example.com",
      contact: "9999999999"
    },
    config: {
      display: {
        blocks: {
          magic: {
            name: "Magic Checkout",
            instruments: [{ method: "magic" }]
          }
        },
        sequence: ["block.magic"],
        preferences: { show_default_blocks: false }
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
