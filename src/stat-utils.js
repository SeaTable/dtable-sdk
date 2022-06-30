import {
  Views, 
  TableUtils,
  DateUtils,
  RowUtils,
  isNumber, 
  CellType,
  FORMULA_RESULT_TYPE,
  FORMULA_COLUMN_TYPES,
  sortText,
  sortNumber,
  sortDate,
  sortSingleSelect,
  getPrecisionNumber,
  getFormulaDisplayString,
  getGeolocationDisplayString,
  getDateDisplayString,
  getNumberDisplayString,
  getCellValueDisplayString,
  getLinkDisplayString,
} from 'dtable-store';

const STATISTICS_COUNT_TYPE = {
  COUNT: 'count',
  ADVANCED: 'advanced',
  DAY: 'day',
  WEEK: 'week',
  QUARTAR: 'quartar',
  MONTH: 'month',
  YEAR: 'year',
  SUM: 'Sum',
  MAX: 'Max',
  MIN: 'Min',
  MEAN: 'Mean',
  PROVINCE: 'province',
  CITY: 'city',
  DISTRICT: 'district'
};

const SUPPORT_SORT_COLUMNS = [
  CellType.TEXT, 
  CellType.NUMBER, 
  CellType.DATE, 
  CellType.SINGLE_SELECT,
  CellType.FORMULA, 
  CellType.LINK_FORMULA, 
  CellType.CTIME, 
  CellType.MTIME, 
  CellType.RATE
];

class StatUtils {

  static getStatisticRows(table, view, value, username, userId) {
    return Views.getViewRows(view, table, value, username, userId);
  }

  static isValidRow(row, formulaRow, linkRow, column, includeEmpty) {
    const { type: columnType, key: columnKey } = column;
    if (includeEmpty || columnType === CellType.CHECKBOX) return true;
    let cellValue;
    if (columnType === CellType.FORMULA || columnType === CellType.LINK_FORMULA) {
      cellValue = formulaRow ? formulaRow[columnKey] : null;
    } else if (columnType === CellType.GEOLOCATION) {
      const value = row[columnKey];
      const { geo_format } = column.data;
      return isEmptyGeolocationCell(value, geo_format);
    } else if (columnType === CellType.LINK) {
      cellValue = linkRow ? linkRow[columnKey] : null;
    } else {
      cellValue = row[columnKey];
    }

    return cellValue || cellValue === 0;
  }

  static getLinkDisplayString(rowIds, linkedTable, displayColumnKey = '0000') {
    return getLinkDisplayString(rowIds, linkedTable, displayColumnKey);
  }

  static getNumberDisplayString(value, columnData) {
    return getNumberDisplayString(value, columnData);
  }

  static getTableFormulaResults(table, rows, value) {
    return Views.getTableFormulaResults(table, rows, value);
  }

  static getTableLinkRows(rows, table, value) {
    return RowUtils.getTableLinkRows(rows, table, value);
  }

  static getCellValueDisplayString(row, type, key, {tables = [], formulaRows = {}, data, collaborators = []}) {
    return getCellValueDisplayString(row, type, key, {tables, formulaRows, data, collaborators});
  }

  static getGroupLabel(
    cellValue,
    formulaRow,
    linkRow,
    column,
    dateGranularity,
    geoGranularity,
    value
  ) {
    let { type, key, data } = column;
    switch (type) {
      case CellType.TEXT: {
        return cellValue || null;
      }
      case CellType.NUMBER: {
        if (!cellValue && cellValue !== 0) {
          return null;
        }
        const number = getPrecisionNumber(cellValue, data);
        let valueNumber = parseFloat(number);
        return isNumber(valueNumber) ? getNumberDisplayString(valueNumber, column.data) : valueNumber;
      }
      case CellType.SINGLE_SELECT: {
        let isInvalidValue =
          data && data.options.findIndex(opt => opt.id === cellValue) < 0;
        if (isInvalidValue) {
          return null;
        }
        return cellValue;
      }
      case CellType.DATE:
      case CellType.CTIME:
      case CellType.MTIME: {
        if (!dateGranularity) {
          return getDateDisplayString(cellValue);
        }
        return DateUtils.getDateByGranularity(cellValue, dateGranularity);
      }
      case CellType.MULTIPLE_SELECT: {
        let options = data && data.options;
        if (!Array.isArray(cellValue)) {
          return [];
        }
        return cellValue.filter(id => options.findIndex(o => o.id === id) > -1);
      }
      case CellType.COLLABORATOR: {
        return getValidCollaborators(value.collaborators, cellValue);
      }
      case CellType.CREATOR:
      case CellType.LAST_MODIFIER: {
        return cellValue ? cellValue : null;
      }
      case CellType.LINK_FORMULA:
      case CellType.FORMULA: {
        if (!formulaRow) return '';
        let formulaCellValue = formulaRow[key];
        let { result_type } = data || {};
        if (result_type === FORMULA_RESULT_TYPE.ARRAY) {
          return getFormulaDisplayString(formulaCellValue, data, {tables: value.tables}) || null;
        }
        if (result_type === FORMULA_RESULT_TYPE.NUMBER) {
          return getPrecisionNumber(formulaCellValue, data);
        }
        return formulaCellValue ? formulaCellValue + '' : null;
      }
      case CellType.GEOLOCATION: {
        const { geo_format } = data || {};
        if (geo_format === 'country_region' || geo_format === 'lng_lat' || !geoGranularity) {
          return getGeolocationDisplayString(cellValue, data);
        }
        return cellValue ? cellValue[geoGranularity] : null;
      }
      case CellType.LINK: {
        if (!linkRow) return null;
        let linkCellValue = linkRow[key] || cellValue;
        return linkCellValue || [];
      }
      case CellType.CHECKBOX: {
        return String(!!cellValue);
      }
      case CellType.RATE: {
        if (!cellValue) return null;
        return cellValue + '';
      }
      default: {
        return null;
      }
    }
  }

  static getTotal(
    summary_column_key,
    summary_column_type,
    summary_type,
    summary_method,
    rows = [],
    formula_rows = {}
  ) {
    let rowsLength = rows.length;
    let total;
    if (summary_type === STATISTICS_COUNT_TYPE.COUNT) {
      total = rowsLength;
    } else if (summary_type === STATISTICS_COUNT_TYPE.ADVANCED) {
      switch (summary_method) {
        case 'Distinct_values': {
          let count = 0;
          let existMap = {};
          rows.forEach(r => {
            let num;
            if (FORMULA_COLUMN_TYPES.includes(summary_column_type)) {
              let formulaRow = formula_rows[r._id] || {};
              num = formulaRow[summary_column_key];
              num = Array.isArray(num) ? num[0] : num;
            } else {
              num = r[summary_column_key];
            }
            if (!num) {
              if (num === 0) {
                num = '0';
              } else {
                num = !!num;
              }
            }
            if (!existMap[num]) {
              existMap[num] = true;
              count++;
            }
          });
          total = count;
          break;
        }
        case "Sum":
        case "Mean": {
          let sum = 0;
          let validNumbersCount = 0;
          rows.forEach(r => {
            let num;
            if (FORMULA_COLUMN_TYPES.includes(summary_column_type)) {
              let formulaRow = formula_rows[r._id] || {};
              num = formulaRow[summary_column_key];
              num = Array.isArray(num) ? num[0] : num;
            } else {
              num = r[summary_column_key];
            }
            if (isNumber(num)) {
              validNumbersCount++;
              sum += num;
            }
          });
          if (summary_method === "Sum") {
            total = Number.parseFloat(sum.toFixed(8));
          } else if (summary_method === "Mean") {
            total =
              validNumbersCount === 0
                ? 0
                : Number.parseFloat((sum / validNumbersCount).toFixed(8));
          }
          break;
        }
        case "Max":
        case "Min": {
          if (rowsLength > 0) {
            let result = rows.reduce((current, next) => {
              let currentValue, nextValue;
              if (FORMULA_COLUMN_TYPES.includes(summary_column_type)) {
                let currentFormulaRow = formula_rows[current._id];
                let nextFormulaRow = formula_rows[next._id];
                currentValue = currentFormulaRow && currentFormulaRow[summary_column_key];
                nextValue = nextFormulaRow && nextFormulaRow[summary_column_key];
                currentValue = Array.isArray(currentValue) ? currentValue[0] : currentValue;
                nextValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;
              } else {
                currentValue = current[summary_column_key];
                nextValue = next[summary_column_key];
              }
              if (!nextValue && nextValue !== 0) {
                return current;
              }
              let isNextGreater = currentValue < nextValue;
              if (summary_method === "Min") {
                return isNextGreater ? current : next;
              } else {
                return isNextGreater ? next : current;
              }
            });
            if (FORMULA_COLUMN_TYPES.includes(summary_column_type)) {
              let formulaRow = formula_rows[result._id];
              total = formulaRow && formulaRow[summary_column_key];
              total = Array.isArray(total) ? total[0] : total;
            } else {
              total = result[summary_column_key];
            }
          }
          break;
        }
        
        default: {
          break;
        }
      }
    }
    return total || 0;
  }

  static sortStatistics(statistics, column, sort_key) {
    let { type: column_type, data } = column;
    let sortType = 'up';
    let option_id_index_map = {};
    if (column_type === CellType.SINGLE_SELECT) {
      const { options } = data || {};
      Array.isArray(options) && options.forEach((option, index) => {
        option_id_index_map[option.id] = index;
      });
    }
    statistics.sort((currResult, nextResult) => {
      let { [sort_key]: current } = currResult;
      let { [sort_key]: next } = nextResult;
      if (!current && current !== 0) {
        return -1;
      }
      if (!next && next !== 0) {
        return 1;
      }
      if (SUPPORT_SORT_COLUMNS.includes(column_type)) {
        switch (column_type) {
          case CellType.NUMBER: {
            if (current) {
              current = current - 0;
            }
            if (next) {
              next = next - 0;
            }
            return sortNumber(current, next, sortType);
          }
          case CellType.DATE:
          case CellType.CTIME:
          case CellType.MTIME: {
            return sortDate(current, next, sortType);
          }
          case CellType.SINGLE_SELECT:
          case CellType.MULTIPLE_SELECT: {
            return sortSingleSelect(current, next, {sort_type: sortType, option_id_index_map});
          }
          case CellType.FORMULA:
          case CellType.LINK_FORMULA: {
            let { result_type } = data || {};
            if (result_type === FORMULA_RESULT_TYPE.NUMBER) {
              if (current) {
                current = current - 0;
              }
              if (next) {
                next = next - 0;
              }
              return sortNumber(current, next, sortType);
            }
            return sortText(result_type, current, next, sortType);
          }
          default: {
            return sortText(current, next, sortType);
          }
        }
      }
    });
  }

  static sortStatisticData(statistics, sort_type) {
    statistics.sort((currResult, nextResult) => {
      let { value: current } = currResult;
      let { value: next } = nextResult;
      if (!current && current !== 0) {
        return -1;
      }
      if (!next && next !== 0) {
        return 1;
      }
      if (sort_type === 'ascending') {
        return current > next ? 1 : -1;
      } else {
        return current > next ? -1 : 1;
      }
    });
  };

  static isArrayCellValue(columnType) {
    return [
      CellType.MULTIPLE_SELECT,
      CellType.COLLABORATOR,
      CellType.LINK
    ].includes(columnType);
  }
}

const getValidCollaborators = (collaborators, emails) => {
  if (!Array.isArray(emails)) {
    return []
  }
  return emails.filter(e => collaborators.findIndex(c => c.email === e) > -1);
};

const isEmptyGeolocationCell = (value, format) => {
  if (!value) return null;
  if (format === 'lng_lat') {
    return value.lng && value.lat;
  }
  if (format === 'country_region') {
    return value.country_region
  }
  return value.province;
}

export default StatUtils;
