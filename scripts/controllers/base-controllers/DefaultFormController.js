import BindableController from "./BindableController.js";

export default class DefaultFormController extends BindableController {
    constructor(element, model) {
        super(element);
        this.model = this.setModel(model);
    }
}