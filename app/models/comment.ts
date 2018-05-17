import { model, Schema } from "mongoose";

const schema = Schema({
	text: { type: String, required: true },
	match: { type: Schema.Types.ObjectId, required: true },
	user: { type: Schema.Types.ObjectId, required: true },
	created: { type: Date, default: Date.now }
});

const Comment = model("comments", schema);

export default Comment;
