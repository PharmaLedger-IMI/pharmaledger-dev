import ModalDataEvent from "../../events/ModalDataEvent.js";
import ContainerController from "./ContainerController.js";

export default class ModalController extends ContainerController {

  constructor(element) {
    super(element);

    let callback = (err, viewModel, responseCallback) => {
      this.model = this.setModel(JSON.parse(JSON.stringify(viewModel)));
      this.responseCallback = responseCallback;
    };

    let modalDataEvent = new ModalDataEvent("bindModalData", {
      callback: callback
    }, {
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    this.element.dispatchEvent(modalDataEvent);

  }
}
