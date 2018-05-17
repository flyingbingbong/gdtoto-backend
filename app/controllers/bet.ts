import { Bet, Nation, Match } from "../models";

export const TIME_OVER = "TIME_OVER";
export const ALREADY_BET = "ALREADY_BET";

export const top5 = async (ctx) => {
	try {
		var bets = await Bet.top5();
		
		for (let b of bets) {
			b.nations = await Nation.find({
				_id: { $in: b.match.nations }
			}).select({ _id: 0, flag: 1, name: 1 });

			b.match = b.match._id;
		}
		ctx.body = bets;
	} catch (err) {
		ctx.throw(500, err);
	}
}

export const betting = async (ctx) => {
	try {
		const user = ctx.state.user;
		const bet_id = ctx.request.body.bet_id;
		if (!user || !bet_id) {
			ctx.status = 406;
			return;
		}

		var bet = await Bet.findOne({ _id: ctx.request.body.bet_id });

		const match = await Match.findOne({ _id: bet.match });
		if (match.date < new Date()) {
			ctx.status = 406;
			ctx.body = { success: false, reason: TIME_OVER };
			return;
		}

		const bet_already = await Bet.find({
			match: match._id,
			users: user._id
		});
		if (bet_already.length) {
			ctx.status = 406;
			ctx.body = { success: false, reason: ALREADY_BET };
			return;
		}
		
		await Bet.update(
			{ _id: bet._id },
			{ $addToSet: { users: user._id }}
		);

		ctx.body = { success: true };
	} catch (err) {
		ctx.throw(500, err);
	}
}

export const byUser = async (ctx) => {
	try {
		const page_size = 10;
		var page = ctx.params.page || 1;
		var bets = await Bet
			.find({ users: ctx.state.user._id })
			.select({ text: 1, point: 1, match: 1 })
			.sort({ point: -1 })
			.skip(page_size * (page - 1))
			.limit(page_size)
			.lean()

		for (let b of bets) {
			var match = await Match.aggregate([
				{ $match: { _id: b.match }},
				{ $lookup: {
					from: "nations",
					localField: "nations",
					foreignField: "_id",
					as: "nations"
				}},
				{ $project: {
					nations: { flag: 1 }
				}}
			]);
			b.nations = match[0].nations;
		}

		ctx.body = bets;
	} catch (err) {
		ctx.throw(500, err);
	}
}

export const search = async (ctx) => {
	try {
		const keyword = ctx.params.keyword;
		if (!keyword) {
			ctx.status = 406;
			return;
		}
		var page = ctx.params.page || 1;
		var bets = await Bet.search(keyword, page);

		for (let b of bets) {
			var match = await Match.aggregate([
				{ $match: { _id: b.match._id }},
				{ $lookup: {
					from: "nations",
					localField: "nations",
					foreignField: "_id",
					as: "nations"
				}},
				{ $project: {
					nations: "$nations.flag"
				}}
			]);
			b.nations = match[0].nations;
		}

		ctx.body = bets;
	} catch (err) {
		ctx.throw(500, err);
	}
}
