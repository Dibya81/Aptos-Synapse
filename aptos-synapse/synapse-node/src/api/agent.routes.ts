import { Router } from "express";
import dotenv from "dotenv";

dotenv.config({ path: ".env.agents" });

export class AgentsRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const getAgentsHandler = (req: any, res: any) => {
      const agents = [
        {
          id: "agent-a",
          name: process.env.AGENT_A_NAME,
          address: process.env.AGENT_A_ADDRESS,
          model: process.env.AGENT_A_MODEL,
          reputation: 95,
          totalTasks: 150,
          canBeOrchestrator: true,
        },
        {
          id: "agent-b",
          name: process.env.AGENT_B_NAME,
          address: process.env.AGENT_B_ADDRESS,
          model: process.env.AGENT_B_MODEL,
          reputation: 88,
          totalTasks: 120,
          canBeOrchestrator: true,
        },
        {
          id: "agent-c",
          name: process.env.AGENT_C_NAME,
          address: process.env.AGENT_C_ADDRESS,
          model: process.env.AGENT_C_MODEL,
          reputation: 92,
          totalTasks: 100,
          canBeOrchestrator: true,
        },
        {
          id: "agent-d",
          name: process.env.AGENT_D_NAME,
          address: process.env.AGENT_D_ADDRESS,
          model: process.env.AGENT_D_MODEL,
          reputation: 85,
          totalTasks: 80,
          canBeOrchestrator: true,
        },
        {
          id: "agent-e",
          name: process.env.AGENT_E_NAME,
          address: process.env.AGENT_E_ADDRESS,
          model: process.env.AGENT_E_MODEL,
          reputation: 90,
          totalTasks: 95,
          canBeOrchestrator: true,
        },
        {
          id: "agent-f",
          name: process.env.AGENT_F_NAME,
          address: process.env.AGENT_F_ADDRESS,
          model: process.env.AGENT_F_MODEL,
          reputation: 87,
          totalTasks: 75,
          canBeOrchestrator: true,
        },
      ];

      res.json({ success: true, agents });
    };

    this.router.get("/", getAgentsHandler);
    this.router.get("/list", getAgentsHandler);
  }
}