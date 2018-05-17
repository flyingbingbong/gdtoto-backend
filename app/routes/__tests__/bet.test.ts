import * as sinon from "sinon";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as request from "supertest";
import * as Koa from "koa";
import * as KoaBody from "koa-body";
import { setup_db, reset_db } from "../../tests/setup";
import { Bet, User, Match, Nation } from "../../models";
import { BetController } from "../../controllers";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Bet router", () => {
	var app, server, 
		fakeTop5Controller, fakeByUserController,
		user, match, bets, bet,
		today, tomorrow;

	before(async () => {
		try {
			await setup_db();
			
			fakeTop5Controller = sinon.stub(BetController, "top5");
			fakeByUserController = sinon.stub(BetController, "byUser");

			today = new Date();
			tomorrow = new Date();
			tomorrow.setDate(today.getDate() + 1);
			user = new User({ 
				id: "asdf@gmail.com",
				school: "Daejeon", classNum: 1, 
				contact: { address: "asdf@gmail.com", type: 0 }
			});
			match = new Match({
				nations: [ new Nation()._id, new Nation()._id ],
				date: tomorrow,
				stage: "D 조 1라운드"
			});
			bets = [
				{ text: "푸틴이 중계 카메라에 잡힌다", point: 50, match: null },
				{ text: "수아레즈가 다른 사람을 문다", point: 30, match: null },
				{ text: "프랑스가 독일을 이긴다", point: 0, match: null }
			];
			await user.save();
			await match.save();
			await Bet.insertMany(bets.map(b => { b.match = match._id; return b; }));
			bet = await Bet.findOne();
			const Koa = require("koa");
			const Router = require("../../routes/bet").default;
			
			app = new Koa();
			app.use(KoaBody());
			app.use(async (ctx, next) => {
				ctx.state.user = user;
				await next();
			});
			app.use(Router.routes()).use(Router.allowedMethods());
			server = app.listen(3000);
		} catch (err) {
			throw err;
		}
	});

	it("should response /bet/top5", async () => {
		try {
			var response;

			fakeTop5Controller.callsFake(async ctx => { ctx.body = [] });
			response = await request(server).get("/bet/top5");
			expect(response.status).to.equal(200);

			fakeTop5Controller.callsFake(async ctx => { 
				try {
					ctx.throw(500, "error");
				} catch (err) {
					ctx.status = 500;
				}
			});
			response = await request(server).get("/bet/top5");
			expect(response.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should response /bet/betting", async () => {
		try {
			var response;

			response = await request(server)
				.post("/bet/betting")
			expect(response.status).to.equal(406);

			response = await request(server)
				.post("/bet/betting")
				.send({ bet_id: bet._id });
			expect(response.status).to.equal(200);

			response = await request(server)
				.post("/bet/betting")
				.send({ bet_id: bet._id });
			expect(response.status).to.equal(406);
			expect(response.body.success).to.equal(false);
			expect(response.body.reason).to.equal(BetController.ALREADY_BET);

			await Match.update({ _id: match._id }, { $set: { date: today }});
			await Bet.update({ _id: bet._id }, { $pull: { users: user._id }});
			response = await request(server)
				.post("/bet/betting")
				.send({ bet_id: bet._id });
			expect(response.status).to.equal(406);
			expect(response.body.success).to.equal(false);
			expect(response.body.reason).to.equal(BetController.TIME_OVER);
		} catch (err) {
			throw err;
		}
	});

	it("should response /bet/byuser", async () => {
		try {
			var response;

			fakeByUserController.callsFake(async ctx => { ctx.body = [] });
			response = await request(server).get("/bet/byuser/1");
			expect(response.status).to.equal(200);

			fakeByUserController.callsFake(async ctx => { 
				try {
					ctx.throw(500, "error");
				} catch (err) {
					ctx.status = 500;
				}
			});
			response = await request(server).get("/bet/byuser/1");
			expect(response.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should response /bet/search", async () => {
		try {
			var response;
			var keyword = "stand by your man";
			var empty_keyword = "";
			
			response = await request(server).get(`/bet/search/${empty_keyword}/1`);
			expect(response.status).to.equal(404);

			response = await request(server).get(`/bet/search/${keyword}/1`);
			expect(response.status).to.equal(200);
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
})
