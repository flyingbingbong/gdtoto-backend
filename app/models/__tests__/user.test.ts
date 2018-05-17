import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as db from "mongoose";
import { User, Match, Bet } from "../";
import { setup_db, reset_db } from "../../tests/setup";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("User model", () => {
	var user_data, match_data, bet_data,
		users;

	beforeEach(async () => {
		try {
			await setup_db();

			user_data = [
				{ 
					id: "asdf@gmail.com",
					school: "Daejeon", classNum: 1, 
					contact: { address: "asdf@gmail.com", type: 0 }
				},
				{ 
					id: "fda@gmail.com",
					school: "Seoul", classNum: 1, 
					contact: { address: "fda@gmail.com", type: 0 }
				},
				{
					id: "mnbv@gmail.com", 
					school: "Incheon", classNum: 1, 
					contact: { address: "mnbv@gmail.com", type: 0 }
				}
			];
			match_data = [ new Match()._id, new Match()._id, new Match()._id ];
			bet_data = [
				{ text: "Putin appears", point: 50 },
				{ text: "Sourez teeth!", point: 40 },
				{ text: "Goal with hitting post", point: 30 },
				{ text: "France wins Germany", point: 20 },
				{ text: "Viking costume appears", point: 10 },
				{ text: "first half injury time is over 5 minutes", point: 0 }
			];
			users = await User.insertMany(user_data);
			users = users.map(v => v.toObject());
			for (let b=0, m=0, u=0; b < bet_data.length; b++, m++, u++) {
				if (m >= match_data.length) { m = 0 };
				if (u >= users.length) { u = 0 };
				bet_data[b].match = match_data[m];
				bet_data[b].users = [ users[u]._id ];

				if (!(users[u].point)) {
					users[u].point = 0;
				}
				users[u].point = users[u].point + bet_data[b].point;
			}
			await Bet.insertMany(bet_data);
		} catch (err) {
			throw err;
		}
	});

	it("shoud maintain unique address", async () => {
		try {
			var dupUser = new User();

			for (var key in user_data[0]) {
				dupUser[key] = user_data[0][key];
			}
			await dupUser.save((err, doc) => {
				expect(err).to.not.equal(null);
			});
		} catch (err) {
			throw err;
		}
	});

	it("shoud show rank", async () => {
		try {
			users.sort((a, b) => b.point - a.point);
			var randomIndex = Math.floor(Math.random() * users.length);
			var expected_rank = users.indexOf(users[randomIndex]) + 1;
			var user = await User.findOne({ _id: users[randomIndex]._id });
			var queried_rank = await user.rank();

			expect(queried_rank.rank).to.equal(expected_rank);
			expect(queried_rank.point).to.equal(users[randomIndex].point);
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
