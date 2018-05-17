import { model, Schema } from "mongoose";
import { getSundayOfCurrentWeek } from "../utils";
import Nation from "./nation";

const schema = Schema({
	date: { type: Date, required: true },
	stage: { type: String, required: true },
	nations: { type: [ Schema.Types.ObjectId ], required:true },
	created: { type: Date, default: Date.now }
});

schema.statics.imminents = async function():Promise<any> {
	try {
		const today = new Date();
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);

		return await this
			.find({ date: { $gte: today, $lte: tomorrow }})
			.sort({ date: 1 })
			.limit(5).lean();
	} catch (err) {
		throw err;
	}
}

schema.statics.atDate = async function(from: Date, to: Date):Promise<any> {
	try {
		return await this.find(
			{ date: { 
				$gte: from,
				$lte: to
			}}
		).sort({ date: 1 }).lean();
	} catch (err) {
		throw err;
	}
}

schema.statics.groupByDate = async function(from: Date, to: Date): Promise<any> {
	try {
		var dateFilter = (from) ? { date: { $gte: from, $lte: to }} : {};

		return await this.aggregate([
			{ $match: dateFilter },
			{ $lookup: {
				from: "nations",
				localField: "nations",
				foreignField: "_id",
				as: "nations"
			}},
			{ $project: {
				_id: 1,
				dateInStr: { $dateToString: {
					format: "%Y-%m-%d",
					date: "$date",
					timezone: "Asia/Seoul"
				}},
				nations: { flag: 1, name: 1 },
				date: 1
			}},
			{ $group: {
				_id: "$dateInStr",
				matches: {
					$push: {
						nations: "$nations",
						date: "$date"
					}
				}
			}},
			{ $sort: { _id: 1 }}
		]);
	} catch (err) {
		throw err;
	}
}

schema.statics.search = async function(keyword: string, page=1):Promise<any> {
	try {
		const page_size = 5;
		var nations = await Nation
			.find({ name: { $regex: `.*${keyword}.*` }})
			.select({ _id: 1 });
		nations = nations.map(n => n._id);

		return await this.aggregate([
			{ $match: { nations: { $in: nations }}},
			{ $project: {
				_id: 1, 
				date: 1,
				nations: 1,
				timeOver: { $cond: { if: { $gte: [ "$date", new Date() ]}, then: false, else: true }}
			}},
			{ $sort: { timeOver: 1 }},
			{ $skip: page_size * (page - 1) },
			{ $limit: page_size }
		]);
	} catch (err) {
		throw err;
	}
}

const Match = model("matches", schema);

export default Match;
