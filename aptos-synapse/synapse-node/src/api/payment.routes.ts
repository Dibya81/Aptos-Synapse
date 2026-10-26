import { Router } from "express";
import { PaymentService } from "../services/payment.service";
import { logger } from "../utils/logger";
import { requirePaymentAuth, isAuthorizedAgentAddress } from "../middleware/auth.middleware";

export class PaymentRoutes {
  public router: Router;
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.router = Router();
    this.paymentService = paymentService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Pay agent - protected with authorization & recipient verification
    this.router.post("/pay", requirePaymentAuth, async (req, res) => {
      try {
        const { recipientAddress, amount, taskId, agentName } = req.body;

        if (!recipientAddress || !amount || taskId === undefined) {
          res.status(400).json({ success: false, error: "Missing required fields (recipientAddress, amount, taskId)" });
          return;
        }

        // Validate recipient is an authorized registered agent
        if (!isAuthorizedAgentAddress(recipientAddress)) {
          logger.warn(`Unauthorized recipient address attempted in payment: ${recipientAddress}`);
          res.status(400).json({
            success: false,
            error: "Recipient address is not an authorized agent in the network.",
          });
          return;
        }

        // Validate amount
        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          res.status(400).json({ success: false, error: "Payment amount must be a positive number." });
          return;
        }

        const MAX_PAYMENT_OCTAS = 100_000_000; // Max 1 APT per single payout
        if (parsedAmount > MAX_PAYMENT_OCTAS) {
          res.status(400).json({
            success: false,
            error: `Payment amount exceeds safety limit of ${MAX_PAYMENT_OCTAS} octas (1 APT).`,
          });
          return;
        }

        // Validate taskId
        const parsedTaskId = Number(taskId);
        if (isNaN(parsedTaskId) || parsedTaskId < 0) {
          res.status(400).json({ success: false, error: "Task ID must be a non-negative integer." });
          return;
        }

        const txHash = await this.paymentService.payAgent({
          recipientAddress,
          amount: parsedAmount,
          taskId: parsedTaskId,
          agentName: agentName || "Unknown",
        });

        res.json({
          success: true,
          data: {
            txHash,
            recipientAddress,
            amount: parsedAmount,
            taskId: parsedTaskId,
            explorerLink: `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`,
          },
        });
      } catch (error) {
        logger.error("Error in payment route:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Get total payments
    this.router.get("/total", async (req, res) => {
      try {
        const total = await this.paymentService.getTotalPayments();
        res.json({
          success: true,
          data: { totalPayments: total },
        });
      } catch (error) {
        logger.error("Error getting total payments:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }
}