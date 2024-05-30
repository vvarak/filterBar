sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/Label',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/comp/smartvariants/PersonalizableInfo',
	"sap/m/MessageToast",
	'sap/ui/core/SeparatorItem',
], function (Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo, MessageToast,SeparatorItem) {
	"use strict";

	return Controller.extend("sap.ui.comp.sample.filterbar.DynamicPageListReport.DynamicPageListReport", {
		onInit: function () {
			var oInitialData = {
				formData: {} // Initialize an empty object to hold form data
			};
			var oModel1 = new JSONModel(oInitialData);
			this.getView().setModel(oModel1, "formDataModel");

			this.oModel = new JSONModel({
				distributorCount:0,
				eastDistributorCount:0,
				westDistributorCount:0,
				southDistributorCount:0,
				northDistributorCount:0
			});
			this.oModel.loadData(sap.ui.require.toUrl("sap/ui/comp/sample/filterbar/DynamicPageListReport/model.json"), null, false);
			this.getView().setModel(this.oModel);

			var aAllDistributors = this.oModel.getProperty("/AllDistributors");
			this.oModel.setProperty("/distributorCount", aAllDistributors.length);

			var oEastDistributors = aAllDistributors.filter(function (distributor) {
				return distributor.Region === "East";
			});
			this.oModel.setProperty("/eastDistributorCount", oEastDistributors.length);

			var oEastDistributors = aAllDistributors.filter(function (distributor) {
				return distributor.Region === "West";
			});
			this.oModel.setProperty("/westDistributorCount", oEastDistributors.length);

			var oEastDistributors = aAllDistributors.filter(function (distributor) {
				return distributor.Region === "South";
			});
			this.oModel.setProperty("/southDistributorCount", oEastDistributors.length);

			var oEastDistributors = aAllDistributors.filter(function (distributor) {
				return distributor.Region === "North";
			});
			this.oModel.setProperty("/northDistributorCount", oEastDistributors.length);


			this.applyData = this.applyData.bind(this);
			this.fetchData = this.fetchData.bind(this);
			this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

			this.oSmartVariantManagement = this.getView().byId("svm");
			this.oExpandedLabel = this.getView().byId("expandedLabel");
			this.oSnappedLabel = this.getView().byId("snappedLabel");
			this.oFilterBar = this.getView().byId("filterbar");
			this.oTable = this.getView().byId("table");

			this.oFilterBar.registerFetchData(this.fetchData);
			this.oFilterBar.registerApplyData(this.applyData);
			this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

			var oPersInfo = new PersonalizableInfo({
				type: "filterBar",
				keyName: "persistencyKey",
				dataSource: "",
				control: this.oFilterBar
			});
			this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
			this.oSmartVariantManagement.initialise(function () { }, this.oFilterBar);
		},

		getGroupHeader: function (oGroup) {
			return new SeparatorItem( {
				text: oGroup.key
			});
		},

		onFilterSelect: function (oEvent) {
			var oBinding = this.byId("table").getBinding("items"),

				sKey = oEvent.getParameter("key"),
				// Array to combine filters
				aFilters = [];

			if (sKey === "East") {
				aFilters.push(
					new Filter("Region", "EQ", "East")
				);
			} else if (sKey === "West") {
				aFilters.push(
					new Filter("Region", "EQ", "West")
				);
			} else if (sKey === "South") {
				aFilters.push(
					new Filter("Region", "EQ", "South")
				);
			} else if (sKey === "North") {
				aFilters.push(
					new Filter("Region", "EQ", "North")
				);
			}
			oBinding.filter(aFilters);
		},

		getCount: function (aDistributors) {
			if (aDistributors && aDistributors.length) {
				return aDistributors.length;
			}
			return 0;
		},

		openAddDistributorForm: function () {
			var oDialog = this.getView().byId("addDistributor");
			oDialog.open();
		},
		onSubmitPress: function () {
			var oResponsivePopover = this.getView().byId("addDistributor");

			// Get input values
			var region = this.getView().byId("regionInput").getValue();
			var distributor = this.getView().byId("distributorNameInput").getValue();
			var kam = this.getView().byId("kamInput").getValue();
			var rsm = this.getView().byId("rsmInput").getValue();

			// Construct form data object
			var formData = {
				Region: region,
				Distributor: distributor,
				KAM: kam,
				RSM: rsm
			};
			// Get the JSON model
			var oModel = this.getView().getModel("formDataModel");
			if (!oModel) {
				console.error("Model 'formDataModel' is not found.");
				return;
			}

			// Update model with new data
			oModel.setProperty("/formData", formData);

			// Log form data
			console.log("Form Data:", formData);

			// Close the ResponsivePopover
			oResponsivePopover.close();
		},
		onCancelPress: function () {
			var oDialog = this.getView().byId("addDistributor");
			oDialog.close();
		},

		onDeleteSelectedRows: function () {
			var oTable = this.byId("table");
			var aSelectedItems = oTable.getSelectedItems();

			if (aSelectedItems.length === 0) {
				// No items selected
				MessageToast.show("No items selected for deletion.");
				return;
			}

			var oModel = this.getView().getModel();
			var aData = oModel.getProperty("/AllDistributors");

			// Loop through selected items and remove them from the model
			aSelectedItems.forEach(function (oItem) {
				var oContext = oItem.getBindingContext();
				var sPath = oContext.getPath();
				var iIndex = parseInt(sPath.split("/").pop(), 10);

				// Remove the item from the data array
				aData.splice(iIndex, 1);
			});

			// Update the model with the new data
			oModel.setProperty("/AllDistributors", aData);

			// Clear table selection
			oTable.removeSelections(true);

			MessageToast.show("Selected items deleted.");
		},

		onExit: function () {
			this.oModel = null;
			this.oSmartVariantManagement = null;
			this.oExpandedLabel = null;
			this.oSnappedLabel = null;
			this.oFilterBar = null;
			this.oTable = null;
		},

		fetchData: function () {
			var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
				aResult.push({
					groupName: oFilterItem.getGroupName(),
					fieldName: oFilterItem.getName(),
					fieldData: oFilterItem.getControl().getSelectedKeys()
				});

				return aResult;
			}, []);

			return aData;
		},

		applyData: function (aData) {
			aData.forEach(function (oDataObject) {
				var oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
				oControl.setSelectedKeys(oDataObject.fieldData);
			}, this);
		},

		getFiltersWithValues: function () {
			var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl();

				if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
					aResult.push(oFilterGroupItem);
				}

				return aResult;
			}, []);

			return aFiltersWithValue;
		},

		onSelectionChange: function (oEvent) {
			this.oSmartVariantManagement.currentVariantSetModified(true);
			this.oFilterBar.fireFilterChange(oEvent);
		},

		onSearch: function () {
			var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl(),
					aSelectedKeys = oControl.getSelectedKeys(),
					aFilters = aSelectedKeys.map(function (sSelectedKey) {
						return new Filter({
							path: oFilterGroupItem.getName(),
							operator: FilterOperator.Contains,
							value1: sSelectedKey
						});
					});

				if (aSelectedKeys.length > 0) {
					aResult.push(new Filter({
						filters: aFilters,
						and: false
					}));
				}
				return aResult;
			}, []);

			this.oTable.getBinding("items").filter(aTableFilters);

			// Apply filters to the table binding
			var oBinding = this.oTable.getBinding("items");
			oBinding.filter(aTableFilters);
		
			// Retrieve and print the filtered data
			var aContexts = oBinding.getContexts();
			var aData = aContexts.map(function(oContext) {
				return oContext.getObject();
			});
		
			console.log(aData);

			this.oModel.setProperty("/distributorCount", aData.length);

			var oEastDistributors = aData.filter(function (distributor) {
				return distributor.Region === "East";
			});
			this.oModel.setProperty("/eastDistributorCount", oEastDistributors.length);

			var oEastDistributors = aData.filter(function (distributor) {
				return distributor.Region === "West";
			});
			this.oModel.setProperty("/westDistributorCount", oEastDistributors.length);

			var oEastDistributors = aData.filter(function (distributor) {
				return distributor.Region === "South";
			});
			this.oModel.setProperty("/southDistributorCount", oEastDistributors.length);

			var oEastDistributors = aData.filter(function (distributor) {
				return distributor.Region === "North";
			});
			this.oModel.setProperty("/northDistributorCount", oEastDistributors.length);

			this.oTable.setShowOverlay(false);
		},

		onFilterChange: function () {
			this._updateLabelsAndTable();
		},

		onAfterVariantLoad: function () {
			this._updateLabelsAndTable();
		},

		getFormattedSummaryText: function () {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			if (aFiltersWithValues.length === 1) {
				return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
			}

			return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
		},

		getFormattedSummaryTextExpanded: function () {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			var sText = aFiltersWithValues.length + " filters active",
				aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();

			if (aFiltersWithValues.length === 1) {
				sText = aFiltersWithValues.length + " filter active";
			}

			if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) {
				sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
			}

			return sText;
		},

		_updateLabelsAndTable: function () {
			this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
			this.oSnappedLabel.setText(this.getFormattedSummaryText());
			this.oTable.setShowOverlay(true);
		}
	});
});


