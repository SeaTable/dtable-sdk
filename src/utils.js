class Utils {

  formatDate(date) {
    return this._formatDate(date);
  }

  formatDateWithMinutes(date) {
    return this._formatDate(date, true);
  }

  _formatDate(date, widthMinutes = false) {
    if (!isNaN(Date.parse(new Date(date)))) {
      let newDate = new Date(date);
      if (newDate && newDate.getYear()) {

        let year = newDate.getFullYear();
        if (String(year).length !== 4) {
          return 'Invalid date';
        };

        let month = newDate.getMonth() + 1;
        let date = newDate.getDate();
        let minute = newDate.getMinutes();
        let hour = newDate.getHours();

        month = month < 10 ? `0${month}` : month;
        date = date < 10 ? `0${date}` : date;
        hour = hour < 10 ? `0${hour}` : hour;
        minute = minute < 10 ? `0${minute}` : minute;

        if (!widthMinutes) {
          return `${year}-${month}-${date}`;
        } else {
          return `${year}-${month}-${date} ${hour}:${minute}`;
        }
      }
    }

    return 'Invalid date';
  }

}

export default Utils;
