async function testCheckout() {
  const baseURL = "http://localhost:3001/api"; // The NestJS default port 3001, not 8081 (8081 is frontend/vite?)
  const tenantId = "04bbc0e0-213d-4af4-9ce8-0e4674a58a90";

  const headers = {
    "x-tenant-id": tenantId,
    "Content-Type": "application/json",
  };

  try {
    console.log("1. Creating Order...");
    const orderResponse = await fetch(`${baseURL}/retail/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        storeId: "sto-bali-001",
        terminalId: "terminal-pos",
        customerId: null,
        items: [
          {
            productId: "var-8c64991b",
            quantity: 1,
            price: 25000,
          },
        ],
        subtotal: 25000,
        tax: 0,
        grandTotal: 25000,
        paymentMethod: "cash",
      }),
    });

    if (!orderResponse.ok) {
      throw new Error(
        `Order failed with status ${orderResponse.status}: ${await orderResponse.text()}`,
      );
    }

    const orderData = await orderResponse.json();
    const orderId = orderData.id;
    console.log("Order created successfully. ID:", orderId);

    console.log("2. Processing Payment...");
    const paymentResponse = await fetch(
      `${baseURL}/retail/orders/${orderId}/payment`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: 25000,
          method: "cash",
        }),
      },
    );

    if (!paymentResponse.ok) {
      throw new Error(
        `Payment failed with status ${paymentResponse.status}: ${await paymentResponse.text()}`,
      );
    }

    const paymentData = await paymentResponse.json();
    console.log(
      "Payment processed successfully:",
      JSON.stringify(paymentData, null, 2),
    );
    console.log("CHECKOUT SUCCESSFUL! ✅");
  } catch (error) {
    console.error("Checkout failed! ❌");
    console.error(error.message);
  }
}

testCheckout();
