export const groupByKey = (arr:Array<any>, keyMaker: (obj) => any):object => {
	const reducer = (accumulator, value, index) => {
		var key = keyMaker(value);

		if (accumulator.hasOwnProperty(key)) {
			accumulator[key].push(value);
		} else {
			accumulator[key] = [ value ];
		}
		return accumulator
	}
	return arr.reduce(reducer, {});
}

export const prettyDate = (date: Date):string => {
	return (
		date.getFullYear() + "-" +
		("0" + (date.getMonth()+1)).slice(-2) + "-" +
		("0" + date.getDate()).slice(-2)
	);
}

export const getSundayOfCurrentWeek = (day: Date):Date => {
	const d = day.getDay();
	const sunday = new Date(
		day.getFullYear(),
		day.getMonth(),
		day.getDate() + (d == 0 ? 0 : 7) - d
	);

	sunday.setHours(23, 59, 59);
	return sunday;
}

export const getMondayOfCurrentWeek = (day: Date):Date => {
	const d = day.getDay();
	const monday = new Date(
		day.getFullYear(),
		day.getMonth(),
		day.getDate() - (d == 0 ? 6 : d - 1)
	);

	monday.setHours(0, 0, 0);
	return monday;
}

export const email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
