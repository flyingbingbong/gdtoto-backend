import { model, Schema } from "mongoose";

const schema:Schema = Schema({
	text: { type: String, required: true },
	match: { type: Schema.Types.ObjectId, required: true },
	users: [ Schema.Types.ObjectId ],
	win: { type: Number, default: -1 },
	point: { type: Number, default: 0 },
	abstention: { type: Boolean, default: false },
	created: { type: Date, default: Date.now }
});

schema.statics.top5 = async function():Promise<any> {
	try {
		return await this.aggregate([
			{ $match: { abstention: false }},
			{ $lookup: {
				from: "matches",
				localField: "match",
				foreignField: "_id",
				as: "match"
			}},
			{ $unwind: "$match" },
			{ $match: { "match.date": { $gte: new Date() }}},
			{ $project: {
				text: 1,
				match: 1,
				users: { $size: "$users" }
			}},
			{ $sort: { users: -1 }},
			{ $limit: 5 }
		]);
	} catch (err) {
		console.log(err);
	}
}

schema.statics.search = async function(keyword: string, page=1):Promise<any> {
	try {
		const page_size = 5;

		return await this.aggregate([
			{ $match: {
				abstention: false,
				text: { $regex: `.*${keyword}.*` }
			}},
			{ $lookup: {
				from: "matches",
				localField: "match",
				foreignField: "_id",
				as: "match"
			}},
			{ $unwind: "$match" },
			{ $project: {
				text: 1,
				match: 1,
				users: { $size: "$users" },
				timeOver: { $cond: { if: { $gte: [ "$match.date", new Date() ]}, then: false, else: true }}
			}},
			{ $sort: { users: -1 }},
			{ $skip: page_size * (page - 1) },
			{ $limit: page_size }
		]);
	} catch (err) {
		throw err;
	}
}

schema.index({ text: "text" });
const Bet = model("bets", schema);

export default Bet;
