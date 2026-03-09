import { BaseAgent } from "../simulation-engine/base.agent";

export class POSAgent extends BaseAgent {
  async createProduct(data: {
    name: string;
    sku: string;
    basePrice: number;
    category: string;
  }) {
    return this.performAction(`Create Product: ${data.name}`, async () => {
      const response = (await this.client.post("/inventory/items", {
        ...data,
        uom: "pcs",
        active: true,
      })) as any;
      return response.data;
    });
  }

  async intakeStock(productId: string, quantity: number, locationId: string) {
    return this.performAction(`Intake Stock: ${productId}`, async () => {
      const response = (await this.client.post("/inventory/intake", {
        itemId: productId,
        quantity,
        locationId,
        unitCost: 10,
        reason: "INITIAL_STOCK",
      })) as any;
      return response.data;
    });
  }

  async createOrder(
    items: Array<{ productId: string; quantity: number }>,
    storeId: string,
  ) {
    return this.performAction("Create POS Order", async () => {
      const payload = {
        storeId,
        terminalId: "TERM-001",
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: 999.99,
        })),
        paymentMethod: "cash",
        grandTotal: items.reduce(
          (sum, item) => sum + item.quantity * 999.99,
          0,
        ),
      };

      const response = (await this.client.request(
        "POST",
        "/retail/orders",
        payload,
      )) as any;

      if (!response.success) {
        this.logger.log(
          `Create POS Order FAILED: ${JSON.stringify(response.data, null, 2)}`,
        );
      }

      return response.data;
    });
  }

  async processPayment(orderId: string, amount: number) {
    return this.performAction(`Process Payment: ${orderId}`, async () => {
      const response = (await this.client.post(
        `/retail/orders/${orderId}/payment`,
        {
          amount,
          method: "cash",
        },
      )) as any;

      if (!response.success) {
        this.logger.log(
          `Process Payment FAILED: ${JSON.stringify(response.data, null, 2)}`,
        );
      }

      return response.data;
    });
  }
}
