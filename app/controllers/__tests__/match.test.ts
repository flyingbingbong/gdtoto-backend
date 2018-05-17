import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import { setup_db, reset_db } from "../../tests/setup";
import { Match, Nation, User, Bet } from "../../models";
import { MatchController } from "../";
import { getMondayOfCurrentWeek, getSundayOfCurrentWeek, groupByKey, prettyDate } from "../../utils";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Match controller", () => {
	var today, yesterday, _2days_ago, tomorrow, _1hour_after, _2hour_after, next_week,
		nation_data, match_data, bet_data, user_data,
		nations, matches, user, match;
	
	beforeEach(async () => {
		try {
			await setup_db();

			today = new Date();
			yesterday = new Date();
			_2days_ago = new Date();
			_1hour_after = new Date();
			_2hour_after = new Date();
			tomorrow = new Date();
			next_week = new Date();
			yesterday.setDate(today.getDate()-1);
			_2days_ago.setDate(today.getDate()-2);
			_1hour_after.setHours(today.getHours()+1);
			_2hour_after.setHours(today.getHours()+2);
			tomorrow.setDate(today.getDate()+1);
			next_week.setDate(today.getDate()+7);
			nation_data = [
				{ name: "한국", flag: "U+1F1F7" },
				{ name: "미국", flag: "U+1F1F8" },
				{ name: "벨기에", flag: "U+1F1E7" }
			];
			match_data = [
				{ date: today, stage: "Group A 2nd round" },
				{ date: today, stage: "Group B 2nd round" },
				{ date: today, stage: "Group C 2nd round" },
				{ date: today, stage: "Group D 2nd round" },
				{ date: today, stage: "Group E 2nd round" },
				{ date: yesterday, stage: "Group A 1st round" },
				{ date: yesterday, stage: "Group B 1st round" },
				{ date: yesterday, stage: "Group C 1st round" },
				{ date: _2days_ago, stage: "Group D 1st round" },
				{ date: _2days_ago, stage: "Group E 1st round" },
				{ date: _1hour_after, stage: "Group A 3rd round" },
				{ date: _1hour_after, stage: "Group B 3rd round" },
				{ date: _1hour_after, stage: "Group C 3rd round" },
				{ date: _2hour_after, stage: "Group D 3rd round" },
				{ date: _2hour_after, stage: "Group E 3rd round" },
				{ date: tomorrow, stage: "Group E 3rd round" },
				{ date: tomorrow, stage: "Group E 3rd round" },
				{ date: tomorrow, stage: "Group E 3rd round" },
				{ date: next_week, stage: "Group A 4th round" },
				{ date: next_week, stage: "Group B 4th round" }
			];
			nations = await Nation.insertMany(nation_data);
			for (let i=0; i < match_data.length; i++) {
				match_data[i].nations = nations.slice(0, 2).map(v => v._id);
			}
			matches = await Match.insertMany(match_data);
			bet_data = [
				{ text: "푸틴이 중계 카메라에 잡힌다" },
				{ text: "수아레즈가 다른 사람을 문다" },
				{ text: "프랑스가 독일을 이긴다" },
				{ text: "위의 일이 아무것도 일어나지 않는다.", abstention: true }
			];
			user = new User({ 
				id: "asdf@gmail.com",
				school: "Daejeon", classNum: 1, 
				contact: { address: "asdf@gmail.com", type: 0 }
			});
			user_data = [];
			match = await Match.findOne().lean();

			await user.save();
			user_data.push(user._id);
			for (let i=0; i < 10; i++) user_data.push(new User()._id);
			for (let i=0, u=0; i < bet_data.length; i++, u += 2) {
				bet_data[i]["match"] = match._id;
				bet_data[i]["users"] = [ user_data[u], user_data[u+1] ];
			}
			await Bet.insertMany(bet_data);
		} catch (err) {
			throw err;
		}
	});

	it("should contains imminent matches in ctx.body", async () => {
		try {
			var ctx = { body: null };
			await MatchController.imminents(ctx);

			expect(ctx.body.length).to.equal(5);
			for (let m of ctx.body) {
				expect(m.nations.length).to.equal(2);
				for (let n of m.nations) {
					expect(n.name).not.to.equal(undefined);
					expect(n.flag).not.to.equal(undefined);
				}
			}
		} catch (err) {
			throw err;
		}
	});

	it("should throw error (imminent)", async () => {
		try {
			var ctx = {
				body: null,
				status: null,
				throw: function(status_code, msg) {
					this.status = status_code 
				}
			};

			sinon.stub(Match, "imminents").throws();
			await MatchController.imminents(ctx);
			expect(ctx.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should contains weekly matches in ctx.body", async () => {
		try {
			var ctx = { body: null };
			var last_day = getSundayOfCurrentWeek(today);
			var test_weekly_matches = match_data.filter(m => m.date > today && m.date <= last_day);
			await MatchController.weekly(ctx);


			expect(ctx.body.length).to.equal(test_weekly_matches.length);
			for (let m of ctx.body) {
				expect(m.nations.length).to.equal(2);
				for (let n of m.nations) {
					expect(n.name).to.not.equal(undefined);
					expect(n.flag).to.not.equal(undefined);
				}
			}
		} catch (err) {
			throw err;
		}
	});

	it("should throw error (weekly)", async () => {
		try {
			var ctx = {
				body: null,
				status: null,
				throw: function(status_code, msg) {
					this.status = status_code 
				}
			};

			sinon.stub(Match, "atDate").throws();
			await MatchController.weekly(ctx);
			expect(ctx.status).to.equal(500);
		} catch (err) {
			throw err;
		}
	});

	it("should return full matches", async () => {
		try {
			var ctx = { body: null };
			var group_obj = groupByKey(match_data, (obj) => {
				return prettyDate(obj.date);
			});
			
			await MatchController.fullMatches(ctx);
			expect(ctx.body.length).to.equal(Object.keys(group_obj).length);
			for (let g of ctx.body) {
				var key = g._id;

				expect(group_obj[key].length).to.equal(g.matches.length);
			}
		} catch (err) {
			throw err;
		}
	});

	it("should return week matches", async () => {
		try {
			var ctx = { body: null };
			var test_week_matches = match_data.filter(m => {
				return (
					m.date >= getMondayOfCurrentWeek(today) && 
					m.date <= getSundayOfCurrentWeek(today) 
				);
			});
			var group_obj = groupByKey(test_week_matches, (obj) => {
				return prettyDate(obj.date);
			});
			
			await MatchController.weekMatches(ctx);
			expect(ctx.body.length).to.equal(Object.keys(group_obj).length);
			for (let g of ctx.body) {
				var key = g._id;

				expect(group_obj[key].length).to.equal(g.matches.length);
			}
		} catch (err) {
			throw err;
		}
	});

	it("should return today matches", async () => {
		try {
			var ctx = { body: null };
			var from = new Date();
			var to = new Date();
			from.setHours(0, 0, 0);
			to.setHours(23, 59, 59);
			var test_today_matches = match_data.filter(m => {
				return (
					m.date >= from && 
					m.date <= to 
				);
			});
			var group_obj = groupByKey(test_today_matches, (obj) => {
				return prettyDate(obj.date);
			});
			
			await MatchController.todayMatches(ctx);
			expect(ctx.body.length).to.equal(Object.keys(group_obj).length);
			for (let g of ctx.body) {
				var key = g._id;

				expect(group_obj[key].length).to.equal(g.matches.length);
			}
		} catch (err) {
			throw err;
		}
	});

	it("should return profile of match", async () => {
		try {
			var ctx = {
				body: null,
				state: { user },
				params: { match_id: match._id }
			};
			await MatchController.profile(ctx);

			expect(ctx.body.bets.length).to.equal(bet_data.length);
			expect(ctx.body.bets.filter(b => b.hasBet == true).length).to.equal(1);
		} catch (err) {
			throw err;
		}
	});

	it("should return searched matches", async () => {
		try {
			var page1, page2;
			var keyword = "미국";
			var ctx = {
				body: null,
				params: { page: 1, keyword },
				status: null
			};

			await MatchController.search(ctx);
			page1 = ctx.body;
			expect(page1).to.not.equal(0);
	
			ctx.params.page = 2;
			await MatchController.search(ctx);
			page2 = ctx.body;
			expect(page2).to.not.equal(0);
		
			expect(page1).to.not.equal(page2);

			ctx.params.keyword = "세상에 없는 나라";
			await MatchController.search(ctx);
			expect(ctx.body.length).to.equal(0);

			ctx.params.keyword = undefined;
			await MatchController.search(ctx);
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
