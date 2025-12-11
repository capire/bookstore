const cds = require('@sap/cds')

// for now, the appid is determined here. It can later be read from cds.env
const packageJson = require(cds.root + '/package.json');
const APPID = packageJson.name;

module.exports = class ExtensibilityService extends cds.ApplicationService {

  async init() {
    const remoteService = await cds.connect.to('cds.xt.RemoteExtensibilityService')

    this.on('*', async (req) => {
      const remotePath = req.req.baseUrl + req.req.path

      // not all headers can be forwarded, so we pick the relevant ones
      const headers = ['x-tenant-id', 'authorization', 'x-correlation-id', 'prefer', 'accept-encoding', 'content-type'].reduce(
        (accumulator, currentValue) => {
          accumulator[currentValue] = req.headers[currentValue]
          return accumulator
        }, {}
      )
      // add appid to the payload
      const data = { appid: APPID, ...req.req.body }
      try {
        // only sync calls supported properly
        const res = await remoteService.send(req.method, remotePath, JSON.stringify(data), headers)
        return res
      } catch (error) {
        // Handle error: root cause still needs to be extracted to see potential compile errors of the extension
        throw error.reason ? error.reason : error
      }
    })
  }
}