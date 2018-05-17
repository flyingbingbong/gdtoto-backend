import Bet from "./bet";
import Comment from "./comment";
import Match from "./match";
import Nation from "./nation";
import User from "./user";

const ENV = process.env;
const DB_ADDRESS:string = (
	"mongodb://" + ENV["DB_USER"] + ":" + 
	ENV["DB_PWD"] + "@" +
	ENV["DB_HOST"] + ":" +
	ENV["DB_PORT"] + "/" +
	ENV["DB_NAME"]
);

export {
	DB_ADDRESS, Bet, Comment, Match, Nation, User
}; 
