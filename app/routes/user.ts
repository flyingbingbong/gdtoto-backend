import * as Router from "koa-router";
import { UserController } from "../controllers";

var router = new Router({
	prefix: "/user"
});

router.get("/profile", UserController.profile);
router.post("/update", UserController.changeContact);

export default router;
