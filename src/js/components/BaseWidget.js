class BaseWidget {
  constructor(wrapperElement, initialValue){
    const thisWidget = this;

    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapperElement;

    thisWidget.correctValue = initialValue;
  }

  get value(){
    const thisWidget = this;
    return thisWidget.correctValue;
  }

  set value(value){
    const thisWidget = this;
    const newValue = thisWidget.parseValue(value);
    //thisWidget.dom.input.value = thisWidget.correctValue;
  
    /* TODO: Add validation */

    if(newValue != thisWidget.correctValue &&
      thisWidget.isValid(newValue)) {
      thisWidget.correctValue = newValue;
      thisWidget.announce();
    }
     
      
    thisWidget.renderValue();
    
  }

  

  isValid(value){
    return !isNaN(value);
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.wrapper.innerHTML = thisWidget.value;
  }

  announce () {
    const thisWidget = this;

    const event = new CustomEvent('updated', {
      bubbles: true
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }

  setValue(value){
    const thisWidget = this;
    
    thisWidget.value = value;
  }
  parseValue(value){
    return parseInt(value);
  }
}

export default BaseWidget;