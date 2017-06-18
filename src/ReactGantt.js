import React, {Component} from 'react';
import moment from 'moment';
import _ from 'underscore';
import Table from 'react-bootstrap/lib/Table';
import {WindowResizeListener} from 'react-window-resize-listener';

export default class ReactGantt extends Component {
	constructor() {
		super();
		this.state = {
			tableId: _.sample('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 32).join(''),
			scaleMarksCount: 99,
			scaleDrawn: false
		};
	}

	renderBar(row) {
		var difference = moment(this.props.options.leftBound).unix();
		var rightBound = moment(this.props.options.rightBound).unix() - difference;
		var startDate = moment(row.startDate).unix() - difference;
		
		if (startDate < 0) {
			startDate = 0;
		} else if (startDate > rightBound) {
			startDate = rightBound;
		}
		
		var climaxDate = moment(row.climaxDate).unix() - difference;
		if (climaxDate < 0) {
			climaxDate = 0;
		} else if (climaxDate > rightBound) {
			climaxDate = rightBound;
		}
		
		var endDate = moment(row.endDate).unix() - difference;
		if (endDate < 0) {
			endDate = 0;
		} else if (endDate > rightBound) {
			endDate = rightBound;
		}
		
		var leftPadWidth = (startDate / rightBound * 100);
		var div1Width = ((climaxDate - startDate) / rightBound * 100);
		var div2Width = ((endDate - climaxDate) / rightBound * 100);
		var rightPadWidth = ((rightBound - endDate) / rightBound * 100) + '%';
		var div1BackgroundColor = 'blue';
		if (row.beforeClimaxColor) {
			div1BackgroundColor = row.beforeClimaxColor;
		} else if (this.props.options.beforeClimaxColor) {
			div1BackgroundColor = this.props.options.beforeClimaxColor;
		}
		
		var div2BackgroundColor = 'red';
		if (row.afterClimaxColor) {
			div2BackgroundColor = row.afterClimaxColor;
		} else if (this.props.options.afterClimaxColor) {
			div2BackgroundColor = this.props.options.afterClimaxColor;
		}
		
		var bar1 = {
			top: 0,
			left: leftPadWidth + '%',
			marginRight: 0,
			backgroundColor: div1BackgroundColor,
			width: div1Width + '%',
			position: 'absolute',
			height: '30px',
			borderTopLeftRadius: '10px',
			borderBottomLeftRadius: '10px',
			boxShadow: '2px 2px 4px #000000',
			zIndex: 2,
		};

		var bar2 = {
			top: 0,
			left: leftPadWidth + '%',
			marginRight: 0,
			backgroundColor: div2BackgroundColor,
			width: (div1Width + div2Width) + '%',
			position: 'absolute',
			height: '30px',
			borderTopRightRadius: '10px',
			borderBottomRightRadius: '10px',
			boxShadow: '2px 2px 4px #000000'
		};

		return [
			(<div style={Object.assign({}, bar1, this.props.barStyle)}>{row.valueBeforeClimax || ''}</div>),
			(<div style={Object.assign({}, bar2, this.props.barStyle)}>{row.valueAfterClimax || ''}</div>)
		];
	}

	renderRows() {
		var rows = [];
		var labelWidth = '80px';

		if (this.props.options && this.props.options.labelWidth) {
			labelWidth = this.props.options.labelWidth;
		}

		var rowStyle = Object.assign({}, {
			cursor: 'pointer'
		}, this.props.rowStyle);

		var titleStyle = Object.assign({}, {
			textAlign: 'right',
			verticalAlign: 'middle',
			paddingRight: '10px',
			fontWeight: 'bold',
			border: (this.props.options.showBorders) ? 'solid' : null,
		}, this.props.titleStyle);

		var timelineStyle = Object.assign({}, {
			width: '100%',
			border: (this.props.options.showBorders) ? 'solid' : null,
		}, this.props.timelineStyle);

		var labelStyle = Object.assign({}, {
			width: labelWidth
		}, this.props.labelStyle);

		if (this.props.rows.length > 0) {
			for(var i = 0; i < this.props.rows.length; i++) {
				var rowObject = this.props.rows[i];

				var elements = [];
				for (var j = 0; j < rowObject.values.length; j++) {
					elements.push(this.renderBar(rowObject.values[j]));
				}

				var row = (
					<tr key={i} style={rowStyle} onClick={rowObject.action} onMouseOver={this.showPopup.bind(this, rowObject)} onMouseOut={this.hidePopup.bind(this)}>
						<td style={titleStyle}>
							<div style={labelStyle}>{rowObject.title}</div>
						</td>
						<td style={timelineStyle}>
							<div style={{ position: 'relative', height: this.props.barHeight }}>
								{elements}
							</div>
						</td>
					</tr>
				);
				rows.push(row);
			}
		} else {
			var row = (
				<tr key={0}>
					<td style={titleStyle}>
						<div style={labelStyle} />
					</td>
					<td style={timelineStyle}>
						<span>No Data</span>
					</td>
				</tr>
			);
			rows.push(row);
		}
		return rows;
	}

	showPopup(row) {
		if (this.bootstrapped) {
			var popover = document.querySelector('#' + this.state.tableId + ' .popover');
			popover.innerHTML = `<div class="card-block">
					<h3 class="card-title">` + row.title + `</h3>
					<h6><b>Start Date</b>: ` + moment(row.startDate).format('MMMM D') + `</h6>
					<h6><b>End Date</b>: ` + moment(row.endDate).format('MMMM D') + `</h6>
				</div>`;
			popover.style.left = this.mouseX + 20 + 'px';
			popover.style.top = this.mouseY - 10 + 'px';
			popover.style.display = 'inline';
		}
	}

	hidePopup() {
		var popover = document.querySelector('#' + this.state.tableId + ' .popover');
		popover.style.display = 'none';
	}

	drawScale() {
		var leftBound = this.props.options.leftBound;
		var rightBound = this.props.options.rightBound;
		var minutes = 0;
		var hours = 0;
		var days = 0;
		var weeks = 0;
		var months = 0;
		var years = moment(rightBound).diff(moment(leftBound), 'years');
		if (years < 2) {
			var months = moment(rightBound).diff(moment(leftBound), 'months');
			if (months < 6) {
				var days = (moment(rightBound).unix() - moment(leftBound).unix()) / 24 / 60 / 60;
				if (days < 2) {
					var hours = moment(rightBound).diff(moment(leftBound), 'hours');
					if (hours < 1) {
						var minutes = moment(rightBound).diff(moment(leftBound), 'minutes');
						this.setState({scale: this.calculateScale(minutes, 'minutes')});
					} else {
						this.setState({scale: this.calculateScale(hours, 'hours')});
					}
				} else {
					this.setState({scale: this.calculateScale(days, 'days')});
				}
			} else {
				this.setState({scale: this.calculateScale(months, 'months')});
			}
		} else {
			this.setState({scale: this.calculateScale(years, 'years')});
		}
	}

	calculateScale(count, type) {
		var options = this.props.options;
		var difference = moment(options.leftBound).unix();
		var widthByTime = moment(options.rightBound).unix() - difference;
		var scale = document.querySelector('#' + this.state.tableId + ' thead td:nth-child(2)');
		var widthByPixels = scale.offsetWidth;
		var markersCount = Math.round(widthByPixels / 100);
		var unitByPixels = widthByPixels / count;
		var maxIntervalWidth = 100;

		if (options.maxIntervalWidth) {
			maxIntervalWidth = options.maxIntervalWidth;
		}

		var unitsPerInterval = 1;
		if (maxIntervalWidth > unitByPixels) {
			unitsPerInterval = Math.floor(maxIntervalWidth / unitByPixels);
		}

		var intervalByPixels = unitsPerInterval * unitByPixels;
		var markersCount = Math.floor(widthByPixels / intervalByPixels);
		var intervalByPercent = intervalByPixels / widthByPixels * 100;
		var markers = [];
		
		var style = Object.assign({}, {
			margin: '0px',
			padding: '0px',
			width: intervalByPercent + '%',
			float: 'left',
			borderLeft: 'solid',
			borderWidth: '1px',
			paddingLeft: '5px'
		}, this.props.headerTitleStyle);

		for (var i = 0; i < markersCount; i++) {
			var date = moment(difference * 1000);
			var formattedInterval;
			switch (type) {
				case 'years':
					date.add(i * unitsPerInterval, 'years');
					formattedInterval = date.format('YYYY MM DD');
					break;
				case 'months':
					date.add(i * unitsPerInterval, 'months');
					formattedInterval = date.format('YYYY MM DD');
					break;
				case 'days':
					date.add(i * unitsPerInterval, 'days');
					formattedInterval = date.format('YYYY MM DD');
					break;
				case 'hours':
					date.add(i * unitsPerInterval, 'hours');
					formattedInterval = date.format('H:mm');
				case 'minutes':
					date.add(i * unitsPerInterval, 'minutes');
					formattedInterval = date.format('H:mm:ss');
				default:
			}

			if (options && options.intervalFormat){
				formattedInterval = date.format(options.intervalFormat);
			}

			var mark = (
				<div key={i} style={style}>
					{ formattedInterval }
				</div>
			);

			markers.push(mark);
		}

		return (
			<div>
				{markers}
			</div>
		);
	}

	componentWillMount() {
		this.bootstrapped = false;
		if (this.props.options.bootstrapped) {
			this.bootstrapped = this.props.options.bootstrapped;
		}

		if (this.props.options.responsive) {
			this.responsive = true;
		}
	}

	componentDidMount() {
		this.previousProps = this.props;
		this.drawScale();

		document.onmousemove = (e) => {
			this.mouseX = e.pageX;
			this.mouseY = e.pageY;
		};
	}

	componentDidUpdate() {
		if (this.previousProps.options !== this.props.options || this.previousProps.rows !== this.props.rows) { // prevents infinite loop
			this.previousProps = this.props;
			this.drawScale();
		}
	}

	render() {
		var tableStyle = Object.assign({}, {
			width: '100%'
		}, this.props.tableStyle);

		var scaleStyle = {
			width: '100%'
		};

		var popoverStyle = {
			position: 'absolute',
			display: 'none'
		};

		if (this.bootstrapped) {
			return (
				<div id={this.state.tableId}>
					<div className="popover card" style={popoverStyle} />
					<Table style={tableStyle} striped bordered condensed hover responsive={this.responsive}>
						<thead>
							<tr>
								<td />
								<td style={scaleStyle}>{this.state.scale}</td>
							</tr>
						</thead>
						<tbody>
							{this.renderRows()}
						</tbody>
					</Table>
					<WindowResizeListener onResize={windowSize => {this.drawScale();}} />
				</div>
			);
		} else {
			return (
				<div id={this.state.tableId}>
					<div className="popover" style={popoverStyle} />
					<table style={tableStyle}>
						<thead>
							<tr>
								<td />
								<td style={scaleStyle}>{this.state.scale}</td>
							</tr>
						</thead>
						<tbody>
							{this.renderRows()}
						</tbody>
					</table>
					<WindowResizeListener onResize={windowSize => {this.drawScale();}} />
				</div>
			);
		}
	}
}

ReactGantt.propTypes = {
	groups: React.PropTypes.array,
	options: React.PropTypes.object,
	rows: React.PropTypes.array,

	/** bar div height  **/
	barHeight: React.PropTypes.number,

	/** sets the bar styling */
	barStyle: React.PropTypes.object,

	/** table styling */
	tableStyle: React.PropTypes.object,

	/** bar title styling */
	titleStyle: React.PropTypes.object,

	/** header text style **/
	headerTitleStyle: React.PropTypes.object,

	/** timeline style **/
	timelineStyle: React.PropTypes.object,

	/** label style **/
	labelStyle: React.PropTypes.object,

	/** row style **/
	rowStyle: React.PropTypes.object,
};

ReactGantt.defaultProps = {
	groups: [],
	barHeight: 50,
	options: {},
	rows: [],
};
