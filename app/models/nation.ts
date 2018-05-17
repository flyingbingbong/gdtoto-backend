import { model, Schema } from "mongoose";

const schema = Schema({
	name: { type: String, required: true, unique: true },
	flag: { type: String, required: true, unique: true },
	created: { type: Date, default: Date.now }
});

const Nation = model("nations", schema);

export default Nation;
