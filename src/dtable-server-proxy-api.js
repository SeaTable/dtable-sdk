import axios from 'axios';

class DTableAPIProxy {

  constructor(server, dtableUuid, accessToken) {
    this.server = server && server.replace(/\/+$/, '') + '/';
    this.dtableUuid = dtableUuid;
    this.accessToken = accessToken;
    this.req = axios.create();
  }

  getTableRelatedUsers() {
    const { server, dtableUuid, accessToken } = this;
    const url = server + 'api/v2.1/dtables/' + dtableUuid + '/related-users/';
    return this.req.get(url, { headers: { 'Authorization': 'Token ' + accessToken } });
  }

  getTableDepartments() {
    const { server, dtableUuid, accessToken } = this;
    const url = server + 'api/v2.1/dtables/' + dtableUuid + '/departments/';
    return this.req.get(url, { headers: { 'Authorization': 'Token ' + accessToken } });
  }
}

export default DTableAPIProxy;
