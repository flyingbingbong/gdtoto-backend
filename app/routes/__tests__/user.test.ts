import * as sinon from "sinon";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as request from "supertest";
import * as Koa from "koa";
import * as KoaBody from "koa-body";
import { setup_db, reset_db } from "../../tests/setup";
import { User } from "../../models";
import { MatchController } from "../../controllers";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("User router", () => {
	var app, server,
		user;

	before(async () => {
		try {
			await setup_db();
			const Router = require("../../routes/user").default;

			user = new User({ 
				id: "asdf@gmail.com",
				school: "Daejeon", classNum: 1, 
				contact: { address: "asdf@gmail.com", type: 0 }
			});
			await user.save();

			app = new Koa();
			app.use(KoaBody());
			app.use(async (ctx, next) => {
				ctx.state.user = user;
				await next();
			});
			app.use(Router.routes()).use(Router.allowedMethods());
			server = await app.listen(3000);
		} catch (err) {
			throw err;
		}
	});

	it("should response /user/profile", async () => {
		try {
			var response;

			response = await request(server).get("/user/profile");
			expect(response.status).to.equal(200);

			response = await request(server).get("/user/profile");
			expect(response.status).to.equal(200);
		} catch (err) {
			throw err;
		}
	});

	it("should response /user/update", async () => {
		try {
			var response;

			response = await request(server).post("/user/update");
			expect(response.status).to.equal(406);

			response = await request(server)
				.post("/user/update")
				.send({ contact: "abcd@gmail.com" });
			expect(response.status).to.equal(200);
			expect(response.body.success).to.equal(true);
		} catch (err) {
			throw err;
		}
	});

	after(async () => {
		try {
			sinon.restore();
			server.close();
			await reset_db();
		} catch (err) {
			throw err;
		}
	});
});
