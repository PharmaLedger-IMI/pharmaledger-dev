import ApplicationController from "./ApplicationController.js";

const PskBindableModel = require("psk-bindable-model");

export default class BindableController extends ApplicationController {

    constructor(element) {
        super(element);
        this.setModel = PskBindableModel.setModel;

        this.__initGetModelEventListener();
    }

    __initGetModelEventListener() {
        this._element.addEventListener("getModelEvent", (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            let { bindValue, callback } = e.detail;

            if (typeof callback === "function") {
                if (bindValue && this.model[bindValue]) {
                    callback(null, this.model[bindValue])
                }

                if (!bindValue) {
                    callback(null, this.model);
                }
            }
            else{
                callback(new Error("No callback provided"));
            }
        });
    }
}