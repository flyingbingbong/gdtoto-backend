import * as Router from "koa-router";
import { BetController } from "../controllers";

var router = new Router({
	prefix: "/bet"
});

router.get("/top5", BetController.top5);
router.post("/betting", BetController.betting);
router.get("/byuser/:page", BetController.byUser);
router.get("/search/:keyword/:page", BetController.search);

export default router;
