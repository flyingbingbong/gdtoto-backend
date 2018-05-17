import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as db from "mongoose";
import { setup_db, reset_db } from "../../tests/setup";
import { Match, Nation } from "../";
import { groupByKey, prettyDate, getSundayOfCurrentWeek } from "../../utils";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Match model", () => {
	var today, yesterday, _2days_ago, tomorrow, _1hour_after, _2hour_after,
		nation_data, match_data,
		nations, matches;

	beforeEach(async () => {
		try {
			await setup_db();

			today = new Date();
			yesterday = new Date();
			_2days_ago = new Date();
			_1hour_after = new Date();
			_2hour_after = new Date();
			tomorrow = new Date();
			yesterday.setDate(today.getDate()-1);
			_2days_ago.setDate(today.getDate()-2);
			_1hour_after.setHours(today.getHours()+1);
			_2hour_after.setHours(today.getHours()+2);
			tomorrow.setDate(today.getDate()+1);
			nation_data = [
				{ name: "Korea Rep.", flag: "U+1F1F7" },
				{ name: "USA", flag: "U+1F1F8" },
				{ name: "England", flag: "U+1F1E7" }
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
			];
			nations = await Nation.insertMany(nation_data);
			for (let i=0; i < match_data.length; i++) {
				match_data[i].nations = nations.slice(0, 2).map(v => v._id);
			}
			matches = await Match.insertMany(match_data);
		} catch (err) {
			throw err;
		}
	});

	it("should return 5 todays match", async () => {
		try {
			var from = new Date();
			var to = new Date();	
			from.setHours(0, 0, 0);
			to.setHours(23, 59, 59);
			var test_today_match = match_data.filter(m => m.date >= from && m.date <= to);
			var today_matches = await Match.atDate(from, to);

			expect(today_matches.length).to.equal(test_today_match.length);
			for (let i=0; i < today_matches.length - 1; i++) {
				expect(today_matches[i].date <= today_matches[i+1].date).to.equal(true);
			}
			for (let i=0; i < today_matches.length; i++) {
				let date = today_matches[i].date;
				expect(
					(date.getFullYear() == today.getFullYear()) &&
					(date.getMonth() == today.getMonth()) &&
					(date.getDate() == today.getDate())
				).to.equal(true);
			}
		} catch (err) {
			throw err;
		}
	});

	it("should return grouped match by date", async () => {
		try {
			var group_obj = groupByKey(match_data, (obj) => {
				return prettyDate(obj.date);
			});
			var grouped = await Match.groupByDate(null, null);

			expect(grouped.length).not.to.equal(0);
			for (let g of grouped) {
				var key = g._id;

				expect(group_obj[key].length).to.equal(g.matches.length);
			}
		} catch (err) {
			throw err;
		}
	});
	
	it("should return imminent matches", async () => {
		try {
			var test_imminents = match_data.filter(m => m.date >= today && m.date <= tomorrow).slice(0, 5);
			var imminents = await Match.imminents();

			expect(imminents.length).to.equal(test_imminents.length);
		} catch (err) {
			throw err;
		}
	});

	it("should return matches with searched nations", async () => {
		try {
			var searched = await Match.search(nation_data[0].name, 2);
			var no_result = await Match.search("foo bar");

			expect(searched.length).to.not.equal(0);
			for (let m of searched) {
				if (m.date > today) expect(m.timeOver).to.equal(false);
				else expect(m.timeOver).to.equal(true);
			}
			expect(no_result.length).to.equal(0);
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
