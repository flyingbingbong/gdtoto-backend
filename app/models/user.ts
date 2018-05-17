import { model, Schema } from "mongoose";

const schema = new Schema({
	id: { type: String, required: true },
	school: { type: String, required: true },
	classNum: { type: Number, default: 0 },
	contact: { 
		address: { type: String, required: true, index: { unique: true }},
		type: { type: Number, default: 0 }
	},
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now }
});

schema.methods.rank = async function():Promise<any> {
	try {
		var agg = await User.aggregate([
			{ $lookup : {
				from: "bets",
				localField: "_id",
				foreignField: "users",
				as: "bets"
			}},
			{ $unwind: "$bets" },
			{ $group: {
				_id: "$_id",
				point: { $sum: "$bets.point" }
		 	}},
			{ $sort: { point: -1 }},
			{ $group: {
				_id: false,
				users: {
					$push: "$$ROOT"
				}
			}},
			{ $unwind: {
				path: "$users",
				includeArrayIndex: "rank"
			}},
			{ $match: { "users._id": this._id }},
			{ $project: {
				_id: 0,
				point: "$users.point",
				rank: { $add: [ "$rank", 1 ]}
			}}
		]);
		return agg[0];
	} catch (err) {
		throw err;
	}
}

const User = model("users", schema);

export default User;
