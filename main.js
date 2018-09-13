const closedDays = require( './dates.json' );
const fs = require( 'fs' );
const Handlebars = require( 'handlebars' );
const monthNames = {
	1:'Styczeń',
	2:'Luty',
	3:'Marzec',
	4:'Kwiecień',
	5:'Maj',
	6:'Czerwiec',
	7:'Lipiec',
	8:'Sierpień',
	9:'Wrzesień',
	10:'Październik',
	11:'listopad',
	12:'Grudzień'
};

class FancyDate {
	constructor( dateString, closedDates ) {
		var closedDates = closedDates || [];
		this.now = new Date();
		this.Date = new Date( dateString );
		this.isOpen = closedDates.indexOf( this.Date.toUTCString() ) > -1;
	}

	get month() { return this.Date.getUTCMonth() + 1; }
	get dayOfMonth(){ return this.Date.getUTCDate(); }
	get dayOfWeek() { return ( this.Date.getUTCDay() === 0 ) ? 7 : this.Date.getUTCDay() ; }
	get year() { return this.Date.getUTCFullYear(); }
	get tomorrow() { return new Date( this.Date.getTime() + (24 * 60 * 60 * 1000) ) }
	get isSunday() {  return this.dayOfWeek === 7 };
	get isToday() {
		var bool = ( this.now.getUTCFullYear() === this.Date.getUTCFullYear() )
		&& (this.now.getUTCMonth() === this.Date.getUTCMonth() )
		&& ( this.now.getUTCDate() === this.Date.getUTCDate() );
		return bool;
	}
	get styleAttr() {
		var styleAttr;
		if ( this.dayOfMonth === 1 ) {
			styleAttr = `style="grid-column-start: ${this.dayOfWeek};"`
		}

		return styleAttr;
	}
	get classAttr() {
		var classList = [];
		var classAttr;
		if ( this.isSunday && this.isOpen  ) {
			classList.push( 'open' );
		} else if ( this.isSunday ) {
			classList.push( 'closed' )
		}

		if ( this.isToday ) {
			classList.push( 'today' )
		}
		if ( classList.length ) {
			classAttr = `class="${classList.join(' ')}"`;
		}
		return classAttr;
	}
}

function range( start, end ) {
	return Array.from(Array(end - start + 1).keys()).map(i => i + start);
};

function daysInRange( startDate, endDate ) {

	var ONE_DAY = 1000 * 60 * 60 * 24,
		msStart = startDate.getTime(),
		msEnd = endDate.getTime(),
		msDifference = Math.abs(msStart - msEnd);
	return Math.round(msDifference/ONE_DAY)
}

function createCalendarData( start, end, closedDays ) {

	var startDate = new FancyDate( start );
	var endDate = new FancyDate( end );
	var numberOfDays = daysInRange( startDate.Date, endDate.Date );
	var tmpDate = new FancyDate( start );
	var data = { allMonths:{} };

	range(0, numberOfDays).forEach( () => {
		var year = tmpDate.year;
		var month = tmpDate.month;
		var monthId = `${year}-${month}`;
		var nextMonthId = `${year}-${parseInt(month)+1}`;
		var prevMonthId = `${year}-${parseInt(month)-1}`;

		if ( data[year] === undefined ) {
			data[year] = {};
		}

		if ( data[year][month] === undefined ) {

			data[year][month] = {};
			data[year][month]['days'] = [];

			if ( ( parseInt( month ) + 1 ) > 12 ) {
				nextMonthId = `${parseInt(year) + 1}-1`;
			}
			if ( ( parseInt( month ) - 1 ) < 1 ) {
				prevMonthId = `${parseInt(year) - 1}-12`;
			}

			data[year][month].monthId = monthId;
			data[year][month].prevMonthId = prevMonthId;
			data[year][month].nextMonthId = nextMonthId;
			data[year][month].monthName = monthNames[ month ];

		}
		if ( data.allMonths[monthId] === undefined ) {
			data.allMonths[monthId] = {};
			data.allMonths[monthId].prevMonthId = prevMonthId;
			data.allMonths[monthId].nextMonthId = nextMonthId;
			data.allMonths[monthId].monthName = `${monthNames[ month ]} ${year}`;
			data.allMonths[monthId].monthId = monthId;
			data.allMonths[monthId].days = [];

		}
		data.allMonths[monthId].days.push( tmpDate );
		data[year][month].days.push( tmpDate );
		tmpDate = new FancyDate( tmpDate.tomorrow, closedDays );
	});
	return data;
}

function generateFile( data ) {
	var source = fs.readFileSync( 'template.handlebars', 'utf8');
	var template = Handlebars.compile(source);
	var today = new FancyDate( new Date() );
	var headline = 'Czy sklepy będą otwarte w niedziele?';
	var yesno = "NIE";
	var nextSunday = new FancyDate( new Date().setDate( today.Date.getDate() + ( 7 - today.dayOfWeek ) ) );
	if (today.isSunday ) {
		headline = "Czy sklepy są otwarte dzisiaj?"
		if ( today.isOpen ) {
			yesno = 'TAK';
		}
	}
	if (new FancyDate( today.tomorrow ).isSunday ) {
		headline = "Czy sklepy będą jutro otwarte?"
	}

	var templateData = {
		calendarUnits: data,
		allMonths: data.allMonths,
		mainHeadline: headline,
		yesno: ( nextSunday.isOpen ) ? 'TAK' : 'NIE'
	}
	var result = template( templateData );
	fs.writeFileSync( 'handlebars-test.html', result );
}

const data = createCalendarData( 'March 1 2018 00:00:00 GMT+00:00', 'December 31 2019 00:00:00 GMT+00:00', closedDays )
generateFile( data );
