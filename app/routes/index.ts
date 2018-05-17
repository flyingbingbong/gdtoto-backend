import * as compose from "koa-compose";
import MatchRouter from "./match";
import UserRouter from "./user";
import BetRouter from "./bet";

var routers = compose([
	MatchRouter.routes(), MatchRouter.allowedMethods(),
	UserRouter.routes(), UserRouter.allowedMethods(),
	BetRouter.routes(), BetRouter.allowedMethods()
]);

export default routers;
