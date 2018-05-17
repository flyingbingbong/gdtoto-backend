import * as sinon from "sinon";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as request from "supertest";
import * as Koa from "koa";
import * as KoaBody from "koa-body";
import { setup_db, reset_db } from "../../tests/setup";
import { Match, Nation } from "../../models";
import { MatchController } from "../../controllers";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Match router", () => {
	var fakeImminentsController, fakeWeeklyController, fakeFullMatchController,
		app, server;

	before(async () => {
		try {
			await setup_db();
 			fakeImminentsController = sinon.stub(MatchController, "imminents");
 			fakeWeeklyController = sinon.stub(MatchController, "weekly");
 			fakeFullMatchController = sinon.stub(MatchController, "fullMatches");
			const Router = require("../../routes/match").default;

			app = new Koa();
			app.use(KoaBody());
			app.use(Router.routes()).use(Router.allowedMethods());
			server = await app.listen(3000);
		} catch (err) {
			throw err;
		}
	});

	it("should response /match/imminents", async () => {
		try {
			var response;

			fakeImminentsController.callsFake(async ctx => { ctx.body = [{}, {}, {}] })
			response = await request(server).get("/match/imminents");
			expect(response.status).to.equal(200);

			fakeImminentsController.callsFake(async ctx => { 
				try {
					ctx.throw(500, "error");
				} catch (err) {
					ctx.status = 500;
				}
			});
			response = await request(server).get("/match/imminents");
			expect(response.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should response /match/weekly", async () => {
		try {
			var response;

			fakeWeeklyController.callsFake(async ctx => { ctx.body = [{}, {}, {}] })
			response = await request(server).get("/match/weekly");
			expect(response.status).to.equal(200);

			fakeWeeklyController.callsFake(async ctx => { 
				try {
					ctx.throw(500, "error");
				} catch (err) {
					ctx.status = 500;
				}
			});
			response = await request(server).get("/match/weekly");
			expect(response.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should response /match/full", async () => {
		try {
			var response;

			fakeFullMatchController.callsFake(async ctx => { ctx.body = [{}, {}, {}] })
			response = await request(server).get("/match/full");
			expect(response.status).to.equal(200);

			fakeFullMatchController.callsFake(async ctx => { 
				try {
					ctx.throw(500, "error");
				} catch (err) {
					ctx.status = 500;
				}
			});
			response = await request(server).get("/match/full");
			expect(response.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should response /match/profile", async () => {
		try {
			var response;
			var unknown_match_id = new Match()._id;
			var match = new Match({
				nations: [ new Nation()._id, new Nation()._id ],
				date: new Date(),
				stage: "D 조 1라운드"
			});
			await match.save();
		
			response = await request(server).get(`/match/profile/${unknown_match_id}`);
			expect(response.status).to.equal(406);

			response = await request(server).get(`/match/profile/${match._id}`);
			expect(response.status).to.equal(200);
		} catch (err) {
			throw err;
		}
	});

	it("should response /match/search", async () => {
		try {
			var response;
			var keyword = "stand by your man";
			var empty_keyword = "";
			
			response = await request(server).get(`/match/search/${empty_keyword}/1`);
			expect(response.status).to.equal(404);

			response = await request(server).get(`/match/search/${keyword}/1`);
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
});
