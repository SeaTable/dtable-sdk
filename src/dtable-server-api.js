import axios from 'axios';
import DTableAPIProxy from './dtable-server-proxy-api';

class DTableServerAPI {

  constructor(config) {
    this.req = axios.create();
    this.config = config;
    this.dtableAPIProxy = new DTableAPIProxy(this.config.server, this.config.dtableUuid, this.config.accessToken);
  }

  getTableData() {
    const { dtableServer, dtableUuid, accessToken, lang } = this.config;
    const url = dtableServer + 'dtables/' + dtableUuid;
    return this.req.get(url, { headers: { 'Authorization': 'Token ' + accessToken }, params: { lang: lang || 'en' } });
  }

  getRowCommentsCount(rowId) {
    const { dtableServer, dtableUuid, accessToken } = this.config;
    const url = dtableServer + 'api/v1/dtables/' + dtableUuid + '/comments-count/';
    let params = {
      row_id: rowId
    };
    return this.req.get(url, {
      headers: { 'Authorization': 'Token ' + accessToken },
      params: params
    });
  }

  getTableRelatedUsers() {
    return this.dtableAPIProxy.getTableRelatedUsers();
  }

  getTableDepartments() {
    return this.dtableAPIProxy.getTableDepartments();
  }

}

export default DTableServerAPI;
