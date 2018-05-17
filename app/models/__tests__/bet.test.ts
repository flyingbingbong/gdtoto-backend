import { expect } from "chai";
import * as db from "mongoose";
import { setup_db, reset_db } from "../../tests/setup";
import { Bet, Match, User, Nation } from "../";

describe("Bet model", () => {
	var today, tomorrow, yesterday,
		bet_data, user_data, match_data,
		nations, matches;

	beforeEach(async () => {
		try {
			await setup_db();

			today = new Date();
			tomorrow = new Date();
			yesterday = new Date();
			tomorrow.setDate(today.getDate() + 1);
			yesterday.setDate(today.getDate() - 1);
			nations = [ new Nation()._id, new Nation()._id ];
			bet_data = [
				{ text: "푸틴이 중계 카메라에 잡힌다" },
				{ text: "수아레즈가 다른 사람을 문다" },
				{ text: "프랑스가 독일을 이긴다" },
				{ text: "노르웨이 선수가 넘어진다" },
				{ text: "네덜란드가 프랑스를 이긴다" },
				{ text: "아이슬란드와 프랑스 경기에서 추가시간이 5분이상이다" },
				{ text: "프랑스선수와 심판이 말싸움을 벌인다" },
				{ text: "루마니아의 프랑스계 선수가 퇴장당한다" },
				{ text: "심판이 프랑스에 매수되었다" },
				{ text: "벨기에는 프랑스어를 쓴다" }
			];
			user_data = [];
			match_data = [
				{ date: yesterday, stage: "Group A 2nd round", nations },
				{ date: yesterday, stage: "Group B 2nd round", nations },
				{ date: today, stage: "Group C 2nd round", nations },
				{ date: today, stage: "Group D 2nd round", nations },
				{ date: tomorrow, stage: "Group E 2nd round", nations },
				{ date: tomorrow, stage: "Group F 2nd round", nations }
			];
			for (let i=0; i < 5; i++) user_data.push(new User()._id);
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

	it("should return 5 top bets", async () => {
		try {
			var top5 = await Bet.top5();

			for (let i=0; i < top5.length - 1; i++) {
				expect(top5[i].users).to.be.at.least(top5[i+1].users);
			}
		} catch (err) {
			throw err;
		}
	});

	it("should search bet by keyword", async () => {
		try {
			var keyword = "프랑스";
			var page_size = 5;
			var bets = bet_data
				.filter(b => b.text.indexOf(keyword) > -1);
			var bets_page1 = bets.slice(0, page_size);
			var bets_page2 = bets.slice(page_size);
			var searched1 = await Bet.search(keyword);
			var searched2 = await Bet.search(keyword, 2);

			expect(bets_page1.length == searched1.length).to.equal(true);
			expect(bets_page2.length == searched2.length).to.equal(true);

			for (let b of searched1.concat(searched2)) {
				var match = await Match.findOne({ _id: b.match._id });

				if (match.date > today) expect(b.timeOver).to.equal(false);
				else expect(b.timeOver).to.equal(true);
			}
		} catch (err) {
			throw err;
		}
	});

	afterEach(async () => {
		try {
			await reset_db();
		} catch (err) {
			throw err;
		}
	});
});
