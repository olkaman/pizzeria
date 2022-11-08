import { templates, select, settings, classNames } from './../settings.js';
import { utils } from './../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.element = element;
    console.log(element);

    thisBooking.render(thisBooking.element);
    thisBooking.getElements();
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };
    //console.log(params);

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.booking.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    console.log(urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }
    //console.log(thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvalilable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvalilable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvalilable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
        table.classList.remove(classNames.booking.tableSelected);
      }
    }
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = generatedHTML;
  }

  getElements() {
    const thisBooking = this;

    thisBooking.dom.peopleAmount =
      thisBooking.dom.wrapper.querySelector('.people-amount');
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.dateWrapper = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourWrapper = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector(
      select.containerOf.tables
    );
    thisBooking.dom.bookingButton = thisBooking.dom.wrapper.querySelector(
      select.booking.bookingButton
    );
    thisBooking.dom.PhoneNumber = thisBooking.dom.wrapper.querySelector(
      select.booking.phoneNumber
    );
    thisBooking.dom.email = thisBooking.dom.wrapper.querySelector(
      select.booking.email
    );
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.starters
    );
  }

  initWidgets() {
    const thisBooking = this;
    console.log('this', this);
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.dateWrapper);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourWrapper);

    thisBooking.dom.wrapper.addEventListener('update', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.tablesWrapper.addEventListener('click', function (e) {
      e.preventDefault();
      thisBooking.initTables(e);
    });

    thisBooking.dom.bookingButton.addEventListener('click', function (e) {
      e.preventDefault();
      thisBooking.sendBooking();
    });
  }

  initTables(e) {
    const thisBooking = this;

    if (e.target.classList.contains('table')) {
      const currentTable = e.target;
      const currentTableId = currentTable.getAttribute('data-table');

      for (let table of thisBooking.dom.tables) {
        if (
          table.classList.contains(classNames.booking.tableSelected) &&
          table !== currentTable
        ) {
          table.classList.remove(classNames.booking.tableSelected);
        }
      }

      if (!currentTable.classList.contains(classNames.booking.tableBooked)) {
        if (
          !currentTable.classList.contains(classNames.booking.tableSelected)
        ) {
          currentTable.classList.add(classNames.booking.tableSelected);
          thisBooking.selectedTable = currentTableId;
        } else {
          currentTable.classList.remove(classNames.booking.tableSelected);
        }
      } else {
        alert('This table is already booked');
      }
    }
    console.log(thisBooking.selectedTable);
  }

  sendBooking() {
    const thisBooking = this;

    const payload = {
      date: thisBooking.datePicker.correctValue,
      hour: thisBooking.hourPicker.correctValue,
      table: parseInt(thisBooking.selectedTable),
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      starters: [],
      phone: thisBooking.dom.PhoneNumber.value,
      email: thisBooking.dom.email.value,
    };
    console.log(
      typeof payload.table,
      typeof payload.duration,
      typeof payload.ppl
    );
    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        payload.starters.push(starter.value);
      }
    }

    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    const url = settings.db.url + '/' + settings.db.booking;

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(
          parsedResponse.date,
          parsedResponse.hour,
          parsedResponse.duration,
          parsedResponse.table
        );
      });
    console.log('jest?', thisBooking.booked);
  }
}

export default Booking;
