import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised"; import * as sinon from "sinon";
import { setup_db, reset_db } from "../../tests/setup";
import { Bet, Match, Nation, User } from "../../models";
import { BetController } from "../";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Bet controller", () => {
	var today, tomorrow, yesterday,
		nation_data, bet_data, user_data, match_data,
		nations, matches, user;

	beforeEach(async () => {
		try {
			await setup_db();
			
			today = new Date();
			tomorrow = new Date();
			yesterday = new Date();
			tomorrow.setDate(today.getDate() + 1);
			yesterday.setDate(today.getDate() - 1);
			nation_data = [
				{ name: "Korea Rep.", flag: "U+1F1F7" },
				{ name: "USA", flag: "U+1F1F8" },
				{ name: "England", flag: "U+1F1E7" }
			];
			bet_data = [
				{ text: "푸틴이 중계 카메라에 잡힌다", point: 50 },
				{ text: "수아레즈가 다른 사람을 문다", point: 40 },
				{ text: "프랑스가 독일을 이긴다", point: 40 },
				{ text: "노르웨이 선수가 넘어진다", point: 30 },
				{ text: "네덜란드가 프랑스를 이긴다", point: 30 },
				{ text: "아이슬란드와 프랑스 경기에서 추가시간이 5분이상이다", point: 20 },
				{ text: "프랑스선수와 심판이 말싸움을 벌인다", point: 20 },
				{ text: "루마니아의 프랑스계 선수가 퇴장당한다", point: 10 },
				{ text: "심판이 프랑스에 매수되었다", point: 10 },
				{ text: "벨기에는 프랑스어를 쓴다", point: 0 }
			];
			match_data = [
				{ date: yesterday, stage: "Group A 2nd round", nations },
				{ date: today, stage: "Group B 2nd round", nations },
				{ date: tomorrow, stage: "Group C 2nd round", nations }
			];
			user_data = [];
			user = new User({ 
				id: "asdf@gmail.com",
				school: "Daejeon", classNum: 1, 
				contact: { address: "asdf@gmail.com", type: 0 }
			});
			await user.save();
			for (let i=0; i < 5; i++) user_data.push(new User()._id);
			nations = await Nation.insertMany(nation_data);
			for (let i=0; i < match_data.length; i++) {
				match_data[i].nations = nations.slice(0, 2).map(v => v._id);
			}
			matches = await Match.insertMany(match_data);
			for (let i=0, m=0; i < bet_data.length; i++, m++) {
				var users = user_data.slice(0, Math.floor(Math.random() * user_data.length));

				if (m >= matches.length) { m = 0 };
				bet_data[i].match = matches[m]._id;
				bet_data[i].users = users.map(v => v._id);
			}
			await Bet.insertMany(bet_data);
		} catch (err) {
			throw err;
		}
	});
	
	it("should contains top5 in ctx.body", async () => {
		try {
			var ctx = { body: null };
			var users = 3/0 // infinity;
			await BetController.top5(ctx);

			for (let b of ctx.body) {
				expect(b.nations.length).to.equal(2);
				expect(b.users).to.be.at.most(users);
				for (let n of b.nations) {
					expect(n.name).to.not.equal(undefined);
					expect(n.flag).to.not.equal(undefined);
				}
				users = b.users;
			}
		} catch (err) {
			throw err;
		}
	});
	
	it("should response of betting", async () => {
		try {
			var tomorrow_match = await Match.findOne({ date: { $gte: tomorrow }});
			var yesterday_match = await Match.findOne({ date: { $lte: yesterday }});
			var bets = await Bet.find({ match: tomorrow_match._id });
			var time_over_bets = await Bet.find({ match: yesterday_match._id });
			
			var ctx = {
				body: null,
				request: { body: { bet_id: null }},
				state: { user },
				status: null
			};
			const init_ctx = (ctx) => {
				ctx.body = null;
				ctx.status = null;
				ctx.request.body.bet_id = null;
			}

			ctx.request.body.bet_id = bets[0]._id;
			await BetController.betting(ctx);
			expect(ctx.body.success).to.equal(true);
			init_ctx(ctx);

			ctx.request.body.bet_id = bets[1]._id;
			await BetController.betting(ctx);
			expect(ctx.status).to.equal(406);
			expect(ctx.body.reason).to.equal(BetController.ALREADY_BET);
			init_ctx(ctx);

			ctx.request.body.bet_id = time_over_bets[0]._id;
			await BetController.betting(ctx);
			expect(ctx.status).to.equal(406);
			expect(ctx.body.reason).to.equal(BetController.TIME_OVER);
		} catch (err) {
			throw err;
		}
	});

	it("should show list of betting by specific user", async () => {
		try {
			var ctx = {
				body: null,
				params: { page: 1 },
				state: { user }
			};
			var bet1 = await Bet.findOne();
			var bet2 = await Bet.findOne({ match: { $ne: bet1.match }});

			await Bet.update(
				{ _id: { $in: [ bet1._id, bet2._id ]}},
				{ $addToSet: { users: user._id }},
				{ multi: true }
			);

			await BetController.byUser(ctx);

			expect(ctx.body.length).to.equal(2);
			for (let b of ctx.body) {
				expect(b.nations.length).to.equal(2);
			}
		} catch (err) {
			throw err;
		}
	});

	it("should return searched matches", async () => {
		try {
			var page1, page2;
			var keyword = "프랑스";
			var ctx = {
				body: null,
				params: { page: 1, keyword },
				status: null
			};

			await BetController.search(ctx);
			page1 = ctx.body;
			expect(page1).to.not.equal(0);
	
			ctx.params.keyword = "절대 없을 검색어";
			await BetController.search(ctx);
			expect(ctx.body.length).to.equal(0);
			expect(ctx.status).to.not.equal(406);

			ctx.params.keyword = undefined;
			await BetController.search(ctx);
			expect(ctx.status).to.equal(406);
		} catch (err) {
			throw err;
		}
	});

	afterEach(async () => {
		try {
			sinon.restore();
			await reset_db();
		} catch (err) {
			throw err;
		}
	});
});
