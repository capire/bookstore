sap.ui.define([
	'sap/ui/core/Core',
	'sap/ui/core/Lib',
	'sap/ui/core/mvc/ControllerExtension'
], function (
	Core,
	Lib,
	ControllerExtension
) {
	'use strict';

	return ControllerExtension.extend('books.ext.controller.UIFlex', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf books.ext.controller.InicdentsList
             */
			onInit: function () {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
				var oModel = this.base.getExtensionAPI().getModel();
			}
		},
		onAdaptUi: async function(oContext, aSelectedContexts) {
			await Lib.load({name: "sap.ui.rta"});
			sap.ui.require([
				"sap/ui/rta/api/startKeyUserAdaptation"
			], (startKeyUserAdaptation) => {
				startKeyUserAdaptation({
					rootControl: Core.byId("books::BooksList--fe::ListReport")
				})
			})
		}
	});
});
