import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import seriesRouter from "./series";
import chaptersRouter from "./chapters";
import usersRouter from "./users";
import commentsRouter from "./comments";
import ratingsRouter from "./ratings";
import socialRouter from "./social";
import popupsRouter from "./popups";
import settingsRouter from "./settings";
import adminRouter from "./admin";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/series", seriesRouter);
router.use("/chapters", chaptersRouter);
router.use("/users", usersRouter);
router.use("/comments", commentsRouter);
router.use("/ratings", ratingsRouter);
router.use("/social-links", socialRouter);
router.use("/popups", popupsRouter);
router.use("/settings", settingsRouter);
router.use("/admin", adminRouter);
router.use("/upload", uploadRouter);

export default router;
