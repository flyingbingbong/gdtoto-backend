import * as Router from "koa-router";
import { MatchController } from "../controllers";

var router = new Router({
	prefix: "/match"
});

router.get("/imminents", MatchController.imminents);
router.get("/weekly", MatchController.weekly);
router.get("/full", MatchController.fullMatches);
router.get("/week", MatchController.weekMatches);
router.get("/today", MatchController.todayMatches);
router.get("/profile/:match_id", MatchController.profile);
router.get("/search/:keyword/:page", MatchController.search);

export default router;
