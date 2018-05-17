import { Match, Nation, Bet } from "../models";
import { getMondayOfCurrentWeek, getSundayOfCurrentWeek } from "../utils";

export const imminents = async (ctx) => {
	try {
		var matches = await Match.imminents();

		for (let m of matches) {
			m.nations = await Nation.find({
				_id: { $in: m.nations }
			}).select({ _id: 0, flag: 1, name: 1 });
		}
		ctx.body = matches;
	} catch (err) {
		ctx.throw(500, err);
	}
}

export const weekly = async (ctx) => {
	try {
		const today = new Date();
		const last_day = getSundayOfCurrentWeek(today);
		var matches = await Match.atDate(today, last_day);

		for (let m of matches) {
			m.nations = await Nation.find({
				_id: { $in: m.nations }
			}).select({ _id: 0, flag: 1, name: 1 }).lean();
		}
		ctx.body = matches;
	} catch (err) {
		ctx.throw(500, err);
	}
}

export const fullMatches = async (ctx) => {
	try {
		ctx.body = await Match.groupByDate();
	} catch (err) {
		ctx.throw(500, err);
	}
};

export const weekMatches = async (ctx) => {
	try {
		const today = new Date();
		const from = getMondayOfCurrentWeek(today);
		const to = getSundayOfCurrentWeek(today);

		ctx.body = await Match.groupByDate(from, to);
	} catch (err) {
		ctx.throw(500, err);
	}
};

export const todayMatches = async (ctx) => {
	try {
		const today = new Date();
		const from = new Date();
		const to = new Date();
		
		from.setHours(0, 0, 0);
		to.setHours(23, 59, 59);

		ctx.body = await Match.groupByDate(from, to);
	} catch (err) {
		ctx.throw(500, err);
	}
};

export const profile = async (ctx) => {
	try {
		var user = ctx.state.user;
		var match = await Match
			.findOne({ _id: ctx.params.match_id })
			.select({ _id: 1, date: 1, stage: 1, nations: 1 }).lean();

		if (!match) {
			ctx.status = 406;
			return;
		}
		match.nations = await Nation
			.find({ _id: { $in: match.nations }})
			.select({ _id: 0, flag: 1, name: 1 }).lean();

		match.bets = await Bet.aggregate([
			{ $match: { match: match._id }},
			{ $sort: { abstention: 1 }},
			{ $addFields: {
				hasBet: user ? {
					$cond: { if: { $in: [ user._id, "$users" ]}, then: true, else: false }
				} : false
			}},
			{ $project: {
				_id: 1,
				text: 1,
				hasBet: 1,
				users: { $size: "$users" }
			}},
		]);

		ctx.body = match;
	} catch (err) {
		ctx.throw(500, err);
	}
};

export const search = async (ctx) => {
	try {
		const keyword = ctx.params.keyword;
		if (!keyword) {
			ctx.status = 406;
			return;
		}
		var page = ctx.params.page || 1;
		var matches = await Match.search(keyword, page);

		for (let m of matches) {
			m.nations = await Nation
				.find({ _id: { $in: m.nations }})
				.select({ _id: 0, flag: 1, name: 1 });
		}
		
		ctx.body = matches;
	} catch (err) {
		ctx.throw(500, err);
	}
};
