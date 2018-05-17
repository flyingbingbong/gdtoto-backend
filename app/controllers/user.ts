import { User, Bet } from "../models";
import { email_regex } from "../utils";

export const profile = async (ctx) => {
	try {
		if (!ctx.state.user) {
			ctx.status = 401;
			return;
		}

		var user = await User
			.findOne({ _id: ctx.state.user._id })
			.select({ id: 1, school: 1, classNum: 1, contact: 1 });
		if (!user) {
			ctx.status = 401;
			return;
		}

		var profile = user.toObject();

		Object.assign(profile, await user.rank());
		delete profile._id;
		ctx.body = profile;
	} catch (err) {
		ctx.throw(500, err);
	}
}

export const changeContact = async (ctx) => {
	try {
		var contact = ctx.request.body.contact;
		if (!contact) {
			ctx.status = 406;
			return;
		}
		var contact_type = email_regex.test(contact) ? 0 : 1;

		await User.update(
			{ _id: ctx.state.user._id },
			{ $set: { contact: { type: contact_type, address: contact }}}
		);
		
		ctx.body = { success: true };
	} catch (err) {
		console.log(err);
		ctx.throw(500, err);
	}
}
