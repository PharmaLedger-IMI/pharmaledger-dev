import PskBindableModel from "./lib/bindableModel.js";

export default class ContainerController {

  constructor(element) {

    let __initGetModelEventListener = () => {
      element.addEventListener("getModelEvent", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        let {
          bindValue,
          callback
        } = e.detail;

        if (typeof callback === "function") {
          if (bindValue && this.model[bindValue]) {
            return callback(null, this.model[bindValue])
          }

          if (!bindValue) {
            return callback(null, this.model);
          }
        }
        callback(new Error("No callback provided"));
      });
    };

    this.element = element;
    this.setModel = PskBindableModel.setModel;
    this.modalsUrls = null;

    __initGetModelEventListener();
  }

  //TODO refactor on, off, send methods. extract a validation function vor arguments check
  on(eventName, htmlElement, callback, options) {
    if (typeof htmlElement === "function") {
      options = callback;
      callback = htmlElement;
      htmlElement = null;
    }

    if (
      !eventName ||
      eventName.trim().length === 0 ||
      !callback ||
      typeof callback !== "function" ||
      !this.element ||
      !this.element.addEventListener
    ) {
      throw new Error("Invalid arguments");
    }

    if (htmlElement) {
      return htmlElement.addEventListener(eventName, callback, options);
    }

    this.element.addEventListener(eventName, callback, options);
  }

  off(eventName, htmlElement, callback, options) {
    if (typeof htmlElement === "function") {
      options = callback;
      callback = htmlElement;
      htmlElement = null;
    }

    if (
      !eventName ||
      eventName.trim().length === 0 ||
      !callback ||
      typeof callback !== "function" ||
      !this.element ||
      !this.element.removeEventListener
    ) {
      throw new Error("Invalid arguments");
    }

    if (htmlElement) {
      return htmlElement.removeEventListener(eventName, callback, options);
    }

    this.element.removeEventListener(eventName, callback, options);
  }

  send(eventName, data, htmlElement) {
    if (
      !eventName ||
      eventName.trim().length === 0 ||
      !this.element ||
      !this.element ||
      !this.element.dispatchEvent
    ) {
      throw new Error("Invalid arguments");
    }

    let newEvent = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: data
    });

    if (htmlElement) {
      return htmlElement.dispatchEvent(newEvent);
    }

    this.element.dispatchEvent(newEvent);
  }


  __getModalsUrl(callback) {

    if (this.modalsUrls) {
      return callback(this.modalsUrls)
    }

    let event = new CustomEvent("getModals", {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: callback
    });

    this.element.dispatchEvent(event);
  }

  showModal(modalName, bindContextData, returnCallback) {

    const completeCallback = (...args) => {
      this.hideModal();
      console.log('Hide modal is called from completecalback');
      returnCallback(...args);
    };

    const bindModalDataHandler = function (evt) {
      let callback = evt.data.callback;
      callback(undefined, bindContextData, completeCallback);
    }

    this.__getModalsUrl((err, modalsUrls) => {
      if (err) {
        throw err;
      }

      if (!modalsUrls) {
        throw new Error("Modals is not configured for this app");
      }

      let appModalPath = modalsUrls[modalName];
      if (!appModalPath) {
        return console.error(`Modal with name ${modalName} does not exists. Did you forgot to add it in app-config.json?`)
      }
      this.__constructModalElement(appModalPath);

      this.element.addEventListener("bindModalData", bindModalDataHandler);
      this.element.addEventListener("closeModal", this.hideModal.bind(this, bindModalDataHandler));
    });
  }

  hideModal(eventHandlerToRemove) {
    let modal = this.element.querySelector("psk-page-loader[data-type=modal]");
    if (modal) {
      modal.remove();
    }

    if (eventHandlerToRemove) {
      this.element.removeEventListener('bindModalData', eventHandlerToRemove);
    }
  }

  __constructModalElement(modalUrl) {
    let modal = this.element.querySelector("psk-page-loader[data-type=modal]");

    if (!modal) {
      modal = document.createElement("psk-page-loader");
      this.element.append(modal);
      modal.setAttribute("data-type", "modal");
    }
    modal.setAttribute("page-url", modalUrl);
  }

}
