import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import { setup_db, reset_db } from "../../tests/setup";
import { Bet, Match, Nation, User } from "../../models";
import { UserController } from "../";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("User controller", () => {
	var user_data, match_data, bet_data, nation_data,
		user, users, nations, matches,
		tomorrow;
		
	beforeEach(async () => {
		try {
			await setup_db();

			tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

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

			nation_data = [
				{ name: "Korea Rep.", flag: "U+1F1F7" },
				{ name: "USA", flag: "U+1F1F8" },
				{ name: "England", flag: "U+1F1E7" }
			];

			match_data = [
				{ date: tomorrow, stage: "Group A 2nd round", nations },
				{ date: tomorrow, stage: "Group B 2nd round", nations },
				{ date: tomorrow, stage: "Group C 2nd round", nations }
			];

			bet_data = [
				{ text: "Putin appears", point: 50 },
				{ text: "Sourez teeth!", point: 50 },
				{ text: "Goal with hitting post", point: 40 },
				{ text: "France wins Germany", point: 40 },
				{ text: "Viking costume appears", point: 30 },
				{ text: "first half injury time is over 5 minutes", point: 30 },
				{ text: "알겠어 알겠어", point: 20 },
				{ text: "떠오르질 않아", point: 20 },
				{ text: "뭐였지?", point: 10 }
			];

			users = await User.insertMany(user_data);
			user = await User.findOne();
			matches = await Match.insertMany(match_data);
			for (let b=0, m=0, u=0; b < bet_data.length; b++, m++, u++) {
				if (m >= matches.length) { m = 0 };
				if (u >= users.length) { u = 0 };
				bet_data[b].match = matches[m]._id;
				bet_data[b].users = [ users[u]._id ];
			}
			await Bet.insertMany(bet_data);
		} catch (err) {
			throw err;
		}
	});
		
	it("should show user profile", async () => {
		try {
			var ctx = {
				body: null,
				state: { user }
			};
		
			await UserController.profile(ctx);

			expect(Object.keys(ctx.body)).to.include("rank");
			expect(Object.keys(ctx.body)).to.include("point");
		} catch (err) {
			throw err;
		}
	});

	it("should chanage contact", async () => {
		try {
			var ctx = {
				body: null,
				state: { user },
				request: { body: {}},
				status: null
			}
			var contact1 = "changed@gmail.com";
			var contact2 = "kakao5454";

			await UserController.changeContact(ctx);
			expect(ctx.status).to.equal(406);
			ctx.status = null;

			ctx.request.body = { contact: contact1 };
			await UserController.changeContact(ctx);
			expect(ctx.body.success).to.equal(true);
			user = await User.findOne({ _id: user._id });
			expect(user.contact.type).to.equal(0);
			expect(user.contact.address).to.equal(contact1);
			
			ctx.request.body = { contact: contact2 };
			await UserController.changeContact(ctx);
			expect(ctx.body.success).to.equal(true);
			user = await User.findOne({ _id: user._id });
			expect(user.contact.type).to.equal(1);
			expect(user.contact.address).to.equal(contact2);
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
