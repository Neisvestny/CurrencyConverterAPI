import { Router } from "express";
import { getUserData } from "../controllers/user.controller";
import { updateUser } from "../controllers/user.controller";

const router = Router();

router.get("/", getUserData);
router.post("/", updateUser);

export default router;