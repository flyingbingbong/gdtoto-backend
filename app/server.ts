import * as Koa from "koa";
import * as db from "mongoose";
import { DB_ADDRESS } from "./models";
import routers from "./routes";

const app = new Koa();
	
db.connect(DB_ADDRESS);

app.use(routers);
const server = app.listen(3000);
console.log("Server start on 3000");
export default server;
