sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "leco/productionorderconfirmation/util/formatter",
    "sap/ui/model/json/JSONModel",
],
    function (Controller, MessageBox, formatter, JSONModel) {
        "use strict";

        return Controller.extend("leco.productionorderconfirmation.controller.ProductionOrderConfirmation", {
            formatter: formatter,

            onInit() {
                const oToday = new Date();
                const sToday = oToday.toISOString().split("T")[0];

                this.byId("confdateInput").setValue(sToday);

                const oOrderInput = this.byId("ordernoInput");

                if (oOrderInput) {
                    oOrderInput.addEventDelegate({
                        onkeypress: function (oEvent) {
                            var pattern = /^[0-9]$/;
                            if (!pattern.test(oEvent.key)) {
                                oEvent.preventDefault();
                            }
                        }
                    });
                }

                this.byId("_IDGenHBox6").setVisible(false);
            },

            onOrderNoChange: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                if (sValue.length > 12) {
                    oEvent.getSource().setValue(sValue.substring(0, 12));
                }
            },

            onScanSuccess: function (oEvent) {
                if (oEvent.getParameter("cancelled")) {
                    MessageToast.show("Scan cancelled", { duration: 1000 });
                } else {
                    if (oEvent.getParameter("text") !== undefined && oEvent.getParameter("text") !== null) {
                        const sText = oEvent.getParameter("text");
                        const oButton = oEvent.getSource();
                        const sInputId = oButton.getCustomData().find(d => d.getKey() === "targetInputId")?.getValue();
                        if (sInputId) {
                            const oInput = this.byId(sInputId);
                            if (oInput) {
                                oInput.setValue(sText);
                            }
                            switch (sInputId) {
                                case "ordernoInput":
                                    this.onGetDetails();
                                    break;
                                case "serialnoInput":
                                    this.onAddSerial();
                                    break;
                                case "serialfromInput":
                                    const sSerialTo = this.byId("serialtoInput").getValue();
                                    if (!sInputId || !sSerialTo) {
                                        break;
                                    } else {
                                        this.onAddSerial();
                                        break;
                                    }
                                case "serialtoInput":
                                    const sSerialFrom = this.byId("serialfromInput").getValue();
                                    if (!sInputId || !sSerialFrom) {
                                        break;
                                    } else {
                                        this.onAddSerial();
                                        break;
                                    }
                                default:
                                    break;
                            }
                        }
                    } else {
                        this.byId("ordernoInput").setValue('');
                    }
                }
            },

            onScanError: function (oEvent) {
                MessageToast.show("Scan failed: " + oEvent, { duration: 1000 });
            },

            onGetDetails: function () {
                const oView = this.getView();
                const oModel = oView.getModel();
                const sOrderNo = this.byId("ordernoInput").getValue();
                this.byId("ordernoInput").setValue('');
                const sPlant = this.byId("plantInput").getValue();
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const sPath = "/ET_HEADERSet(OrderNumber='" + sOrderNo + "',ProductionPlant='" + sPlant + "')";

                oModel.read(sPath, {
                    
                    success: function (oData) {
                        console.log("Data retrieved:", oData);

                        this.byId("materialInput").setValue(oData.Material);
                        this.byId("orderqtyInput").setValue(oData.TargetQuantity);
                        this.byId("ordertypeInput").setValue(oData.OrderType);
                        this.byId("strlocationInput").setValue(oData.StrLoc);
                        this.byId("uomInput").setValue(oData.Unit);
                        if (oData.OpenQty.includes(".")) {
                            oData.OpenQty = oData.OpenQty.split(".")[0];
                            this.byId("openqtyInput").setValue(oData.OpenQty);
                        }
                        this.byId("sonoInput").setValue(oData.SalesOrder);
                        this.byId("soitemInput").setValue(oData.SalesOrderItem);
                        this.byId("confqtyInput").setEditable(false).setValue(0);
                        this.byId("sotextInput").setValue(oData.SoText);
                        this.byId("plantInput").setValue(oData.ProductionPlant);
                        this.byId("ordernoReadonlyInput").setValue(oData.OrderNumber);
                        const oView = this.getView();
                        oView.byId("workorderdataPanel").setVisible(true);
                        oView.byId("serialnumberentryPanel").setVisible(true);
                        oView.byId("serialnumberdataPanel").setVisible(true);
                        oView.byId("saveButton").setVisible(true);
                        oView.byId("finalCheckbox").setVisible(true);

                        const oModel = oView.getModel("serialModel");
                        if (!oModel) {
                            const oModel = new JSONModel({
                                records: []
                            });
                            this.getView().setModel(oModel, "serialModel");
                        }

                        if (!oData.SerialManaged) {
                            this.scenarioNoSerials();
                        }

                    }.bind(this),
                    error: function (oError) {
                        console.error("Error fetching data:", oError);
                        try {
                            const oResponse = JSON.parse(oError.responseText);
                            if (oResponse && oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                                var sMessage = oResponse.error.message.value;
                            }
                        } catch (e) {
                            sMessage = oError.message || oError.responseText;
                        }
                        MessageBox.error(sMessage);
                    }
                });
            },

            onSingleSelect: function () {
                this.byId("_IDGenHBox6").setVisible(false);
                this.byId("_IDGenHBox5").setVisible(true);
                this.byId("addButton").setVisible(true);
                if (this.byId("confqtyInput").getEditable()) {
                    this.byId("confqtyInput").setEditable(false).setValue(0);
                }

                this.byId("serialnumberdataPanel").setVisible(true);
            },

            onRangeSelect: function () {
                this.byId("_IDGenHBox5").setVisible(false);
                this.byId("_IDGenHBox6").setVisible(true);
                this.byId("addButton").setVisible(true);
                this.byId("confqtyInput").setEditable(false);
                this.byId("serialnumberdataPanel").setVisible(true);
                if (this.byId("confqtyInput").getEditable()) {
                    this.byId("confqtyInput").setEditable(false).setValue(0);
                }
            },

            scenarioNoSerials: function () {
                this.byId("serialnumberentryPanel").setVisible(false);
                this.byId("serialnumberdataPanel").setVisible(false);
                this.byId("confqtyInput").setEditable(true).setValue(0);

                const oModel = this.getView().getModel("serialModel");
                if (oModel) {
                    const oModel = new JSONModel({
                        records: []
                    });
                    this.getView().setModel(oModel, "serialModel");
                }
            },

            onClear: function () {
                const oView = this.getView();
                const oModel = oView.getModel("serialModel");
                const oToday = new Date();
                const sToday = oToday.toISOString().split("T")[0];

                if (oModel) {
                    oModel.setProperty("/records", []);
                }

                oView.byId("workorderdataPanel").setVisible(false);
                oView.byId("serialnumberentryPanel").setVisible(false);
                oView.byId("serialnumberdataPanel").setVisible(false);
                oView.byId("saveButton").setVisible(false);
                oView.byId("finalCheckbox").setVisible(false);
                this.byId("materialInput").setValue('');
                this.byId("orderqtyInput").setValue('');
                this.byId("ordertypeInput").setValue('');
                this.byId("strlocationInput").setValue('');
                this.byId("uomInput").setValue('');
                this.byId("openqtyInput").setValue('');
                this.byId("sonoInput").setValue('');
                this.byId("soitemInput").setValue('');
                this.byId("confqtyInput").setValue('');
                this.byId("serialnoInput").setValue('');
                this.byId("confdateInput").setValue(sToday);
                this.byId("sotextInput").setValue('');
                this.byId("ordernoInput").setValue('');
                this.byId("plantInput").setValue('');
                this.byId("ordernoReadonlyInput").setValue('');
                this.byId("finalCheckbox").setSelected(false);
                this.byId("confqtyInput").setEditable(false).setValue(0);
            },

            onAddSerial: function () {
                const oView = this.getView();
                const oModel = oView.getModel("serialModel");
                if (!oModel) {
                    const oModel = new JSONModel({
                        records: []
                    });
                    this.getView().setModel(oModel, "serialModel");
                }

                const sOrderNo = this.byId("ordernoReadonlyInput").getValue();
                const oSerialInput = oView.byId("serialnoInput");
                const sSerial = oSerialInput.getValue().trim();
                oSerialInput.setValue("");
                const oSerialInputFrom = oView.byId("serialfromInput");
                const sSerialFrom = oSerialInputFrom.getValue().trim();
                oSerialInputFrom.setValue("");
                const oSerialInputTo = oView.byId("serialtoInput");
                const sSerialTo = oSerialInputTo.getValue().trim();
                oSerialInputTo.setValue("");

                this.getSerialNumber(sOrderNo, sSerial, sSerialFrom, sSerialTo);
            },

            _buildRange: function (sStart, sEnd) {
                const startParts = sStart.match(/\D+|\d+/g);
                const endParts = sEnd.match(/\D+|\d+/g);

                if (!startParts || !endParts || startParts.length !== endParts.length) {
                    MessageBox.error("Start and end formats do not match.");
                    console.error("Start and end formats do not match.");
                    return [];
                }

                let rangeIndex = -1;
                for (let i = 0; i < startParts.length; i++) {
                    if (!isNaN(startParts[i]) && startParts[i] !== endParts[i]) {
                        rangeIndex = i;
                        break;
                    }
                }

                if (rangeIndex === -1) {
                    MessageBox.error("No numeric range found.");
                    console.error("No numeric range found.");
                    return [];
                }

                const startNum = parseInt(startParts[rangeIndex], 10);
                const endNum = parseInt(endParts[rangeIndex], 10);
                const padLength = startParts[rangeIndex].length;

                let result = [];
                for (let i = startNum; i <= endNum; i++) {
                    const padded = i.toString().padStart(padLength, '0');
                    const newParts = [...startParts];
                    newParts[rangeIndex] = padded;
                    result.push(newParts.join(''));
                }

                return result;
            },

            getSerialNumber: function (sOrderNo, sSerial, sSerialFrom, sSerialTo) {
                const oView = this.getView();
                const oOdataModel = oView.getModel();
                const oSerialModel = oView.getModel("serialModel");
                if (!oSerialModel) {
                    const oSerialModel = new JSONModel({
                        records: []
                    });
                    this.getView().setModel(oSerialModel, "serialModel");
                }

                if (!sSerial) {
                    var aRange = this._buildRange(sSerialFrom, sSerialTo);
                } else {
                    var aRange = [sSerial];
                }

                aRange.forEach(function (value) {
                    const sPath = "/ET_SERIALNUMBERSet(ProductionOrder='" + sOrderNo + "',SerialNumber='" + value + "')";

                    oOdataModel.read(sPath, {
                        success: function (oData) {
                            console.log("Data retrieved:", oData)

                            let aRecords = oSerialModel.getProperty("/records");

                            aRecords.push({
                                nosave: oData.NoSave,
                                notfound: oData.NotFound,
                                productionorder: oData.ProductionOrder,
                                serialnumber: oData.SerialNumber,
                                serialstatus: oData.SerialStatus
                            });
                            const seen = new Set();
                            aRecords = aRecords.filter(item => {
                                if (seen.has(item.serialnumber)) {
                                    return false;
                                }
                                seen.add(item.serialnumber);
                                return true;
                            });

                            const iRecords = aRecords.length;
                            oView.byId("confqtyInput").setValue(iRecords);
                            const sOpenQty = oView.byId("openqtyInput").getValue();
                            const sResult = (iRecords >= sOpenQty) ? true : false;
                            oView.byId("finalCheckbox").setSelected(sResult);
                            aRecords.sort((a, b) => a.serialnumber.localeCompare(b.serialnumber, undefined, { numeric: true, sensitivity: 'base' }));
                            oSerialModel.setProperty("/records", aRecords);
                            oSerialModel.refresh(true);
                        }.bind(this),
                        error: function (oError) {
                            console.error("Error fetching data:", oError);
                            try {
                                const oResponse = JSON.parse(oError.responseText);
                                if (oResponse && oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                                    var sMessage = oResponse.error.message.value;
                                }
                            } catch (e) {
                                sMessage = oError.message || oError.responseText;
                            }
                            MessageBox.error(sMessage);
                        }
                    })
                });
            },

            onDelete: function (oEvent) {
                const oSource = oEvent.getSource();
                const oContext = oSource.getBindingContext("serialModel");

                const sPath = oContext.getPath();
                const iIndex = parseInt(sPath.split("/")[2]);

                const oModel = this.getView().getModel("serialModel");
                const aRecords = oModel.getProperty("/records");

                aRecords.splice(iIndex, 1);
                oModel.setProperty("/records", aRecords);

                const iRecords = aRecords.length;
                const oView = this.getView();
                oView.byId("confqtyInput").setValue(iRecords);
                const sOpenQty = this.byId("openqtyInput").getValue();
                const sResult = (iRecords >= sOpenQty) ? true : false;
                oView.byId("finalCheckbox").setSelected(sResult);
                oModel.refresh(true);
            },

            onSave: function () {
                const oSerialModel = this.getView().getModel("serialModel");
                const aSerialData = oSerialModel.getData();
                const sStrLoc = this.byId("strlocationInput").getValue();
                const sConfDate = this.byId("confdateInput").getValue();
                const sConfirmed = this.byId("finalCheckbox").getSelected();
                const sConfQty = this.byId("confqtyInput").getValue();
                const oPayload = {
                    ProductionOrder: "",
                    StrLoc: "",
                    ConfDate: "",
                    ConfQty: "",
                    ToSerials: [],
                    TestFlag: false,
                    FinalFlag: sConfirmed
                };

                const bValid = true;
                const sInvalidSerial = "";
                oPayload.ProductionOrder = this.byId("ordernoReadonlyInput").getValue();
                oPayload.StrLoc = sStrLoc;
                oPayload.ConfDate = sConfDate;
                oPayload.ConfQty = sConfQty;
                if (sConfQty === "0" && aSerialData.records.length === 0) {
                    MessageBox.error("Confirmation Qty is required" );
                    return;
                }
                for (let i = 0; i < aSerialData.records.length; i++) {
                    if (aSerialData.records[i].nosave) {
                        bValid = false;
                        sInvalidSerial = aSerialData.records[i].serialnumber;
                        break;
                    }
                    oPayload.ToSerials.push({
                        SerialNumber: aSerialData.records[i].serialnumber
                    });
                }

                if (!bValid) {
                    MessageBox.error("Serial " + sInvalidSerial + " is not valid, delete it before continuing");
                    return;
                }

                const oModel = this.getView().getModel();
                oModel.setUseBatch(false);
                oModel.create("/ET_SERIALSWRAPPERSet", oPayload, {
                    success: function (oData, response) {
                        if (oData.MessageType === "E" || oData.MessageType === "A") {
                            MessageBox.error("Error: " + oData.Message);
                        } else {
                            console.log("Doc Created: " + oData.MatDoc);
                            if (oData.Message) {
                                console.log(oData.Message);
                            }
                            this.onClear();
                        }

                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("Odata service call failed");
                        console.log("Odata service call failed");
                    }
                })
            }
        });
    });
