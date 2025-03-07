import axios from 'axios';

class DTableWebAPI {

  constructor(config) {
    this.config = config;
    this.req = axios.create();
  }

  login() {
    const { server, username, password } = this.config;
    const url = server + '/api2/auth-token/';
    return axios.post(url, {
      username,
      password
    }).then((response) => {
      this.token = response.data.token;
      this.req = axios.create({
        baseURL: server,
        headers: { 'Authorization': 'Token ' + this.token }
      });
    });
  }

  getDTableAccessToken() {
    const { server, APIToken } = this.config;
    const url = server + '/api/v2.1/dtable/app-access-token/';
    const headers = { 'Authorization': 'Token ' + APIToken };
    return this.req.get(url, { headers: headers });
  }

  getFileUploadLink() {
    const { server, APIToken, workspaceID, dtableName } = this.config;
    const url = server + '/api/v2.1/dtable/app-upload-link/';
    const headers = { 'Authorization': 'Token ' + APIToken };
    const params = { workspace_id: workspaceID, name: dtableName };
    return this.req.get(url, { headers: headers, params: params });
  }

  getTableAssetUploadLink(workspaceID, name) {
    const { server } = this.config;
    const url = server + '/api/v2.1/workspace/' + workspaceID + '/dtable-asset-upload-link/?name=' + encodeURIComponent(name);
    return this.req.get(url);
  }

  getCustomAssetUploadLink(parentDir) {
    const { server, dtableUuid } = this.config;
    const url = server + '/api/v2.1/dtable-custom-asset/' + dtableUuid + '/upload-link/?parent_dir=' + encodeURIComponent(parentDir);
    return this.req.get(url);
  }

  uploadImage(uploadLink, formData, onUploadProgress = null) {
    return (
      axios.create()({
        method: "post",
        data: formData,
        url: uploadLink,
        onUploadProgress: onUploadProgress
      })
    );
  }

  getUserCommonInfo(email, avatarSize) {
    const { server } = this.config;
    const url = server + '/api/v2.1/user-common-info/' + email;
    let params = {
      avatar_size: avatarSize
    };
    return this.req.get(url, { params: params });
  }

  addConvertPageTask(workspaceId, dtableName, params) {
    const { server } = this.config;
    const url = server + '/api/v2.1/workspace/' + workspaceId + '/dtable/' + encodeURIComponent(dtableName) + '/convert-page/';
    return this.req.get(url, { params: params });
  }

  cancelDTableIOTask(taskId, dtable_uuid, task_type) {
    const { server } = this.config;
    let url = server + '/api/v2.1/dtable-io-status/';
    let params = {
      task_id: taskId,
      dtable_uuid: dtable_uuid,
      task_type: task_type
    };
    return this.req.delete(url, { params: params });
  }

  queryDTableIOStatusByTaskId(taskId) {
    const { server } = this.config;
    let url = server + '/api/v2.1/dtable-io-status/?task_id=' + taskId;
    return this.req.get(url);
  }

}

export default DTableWebAPI;
