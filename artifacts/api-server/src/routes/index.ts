import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import availabilityRouter from "./availability";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/availability", availabilityRouter);

export default router;
