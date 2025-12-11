using {cds.xt.ExtensibilityService.Extensions} from '@sap/cds-mtxs/srv/extensibility-service';

service cds.xt.RemoteExtensibilityService {}

annotate cds.xt.ExtensibilityService with @impl :'srv/delegating-extensibility-service.js';
