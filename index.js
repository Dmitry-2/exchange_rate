"use strict";

const options = {
	day: 'numeric',
	weekday: 'long',
	month: 'long',
	year: 'numeric'
};

let previousUrl;

document.addEventListener('DOMContentLoaded', viewRate);
document.addEventListener('mouseup', hidePreviousValues);

function viewRate() {
	const rateTable = document.getElementById('rate');
	const url = 'https://www.cbr-xml-daily.ru/daily_json.js';

	fetch(url).then(addNewValuesInTable, addMessageError.bind(this, rateTable));

	rateTable.addEventListener('click', addPreviousValuesInTable);

	async function addNewValuesInTable(response) {
		const data = await response.json();

		previousUrl = 'https:'+data.PreviousURL;

		for (let key in data.Valute) {
			let valute = data.Valute[key];

			rateTable.insertAdjacentHTML('beforeend', `
				<tr id="${valute.CharCode}" title="${valute.Nominal} ${valute.Name}" class="valute">
					<td>${valute.CharCode}</td>
					<td>${valute.Value}</td>
					<td>${calcPercent(valute.Value, valute.Previous)}</td>
				</tr>
			`);
		}
	}

	async function addPreviousValuesInTable(e) {
		if (e.target.tagName == 'TH' || e.target.classList.contains('error')) {
			return;
		}

		const parent = e.target.parentElement,
				valuteTable = document.getElementsByClassName(parent.id)[0];

		if (valuteTable) {
			valuteTable.style.display = 'table';
		} else {
			const table = document.createElement('table'),
					th = document.createElement('th');

			th.colSpan = 3;
			th.innerText = parent.title;

			table.append(th);
			table.className = `valute-table ${parent.id}`;
			table.style.top = parent.offsetTop + 37 + 'px';
			table.style.left = parent.offsetParent.offsetLeft + 20 +'px';
			
			rateTable.after(table);

			for (let i = 0; i < 10; i++) {
				await fetch (previousUrl).then(async response => {
					const data = await response.json(),
							valute = data.Valute[parent.id];

					previousUrl = 'http:'+ data.PreviousURL;

					table.insertAdjacentHTML('beforeend', `
						<tr>
							<td>${new Date(data.Date).toLocaleString('ru', options)}</td>
							<td>${valute.Value}</td>
							<td>${calcPercent(valute.Value, valute.Previous)}</td>
						</tr>
					`);
				}, addMessageError.bind(null, table));
			}
		}
	}
}

async function addMessageError(table, error) {
	console.log('%cError', 'color:darkorange', error);
	table.insertAdjacentHTML('beforeend', '<tr><td colspan="3" class="error">Не удалось загрузить данные</td></tr>');
}

function calcPercent(current, previous) {
	let diff, percent;

	if (current > previous) {
		diff = current - previous;
		percent = 100 / (current / diff);
		return `▲ +${percent.toFixed(2)}%`;
	}
	if (current < previous) {
		diff = previous - current;
		percent = 100 / (current / diff);
		return `▼ -${percent.toFixed(2)}%`;
	}
	return '';
}

function hidePreviousValues(e) {
	const tables = document.getElementsByClassName('valute-table');
	if (tables.length && !e.target.closest('.valute-table')) {
		for (let i = 0; i < tables.length; i++) {
			tables[i].style.display = 'none';
		}
	}
}