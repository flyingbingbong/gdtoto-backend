import * as db from "mongoose";
import * as models from "../models";

export var setup_db = async (): Promise<any> => {
	db.models = {};
	db.modelSchemas = {};
	await db.connect(models.DB_ADDRESS);
}

export var reset_db = async (): Promise<any> => {
	var collections = Object.keys(db.connection.collections);
	for (let c of collections) {
		db.connection.collections[c].remove();
	}
	await db.disconnect()
}
