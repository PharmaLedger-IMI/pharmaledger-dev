export default class ModalDataEvent extends CustomEvent{

  constructor(eventName, eventData, eventOptions) {
    super(eventName, eventOptions);
    this.data = eventData;
  }
}
