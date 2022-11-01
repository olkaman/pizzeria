import {utils} from './../utils.js';
import {templates, select, classNames} from './../settings.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

  }

  renderInMenu(){
    const thisProduct = this;

    /*generate HTML of product*/
    const productHTML = templates.menuProduct(thisProduct.data);

    /*create element using utils.createDOMFromHTML*/
    const element = utils.createDOMFromHTML(productHTML);
    thisProduct.element = element;
    console.log(element);

    /*find menu container*/
    const menuContainer = document.querySelector(select.containerOf.menu);

    /*add element to menu*/
    menuContainer.appendChild(element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;

    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(e){
      /* prevent default action for event */
      e.preventDefault();

      /* find active product (product that has active class) */
      const activeElements = document.querySelectorAll('.product.active');

      for(let activeElement of activeElements){

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeElement !== thisProduct.element) {
          activeElement.classList.remove(classNames.menuProduct.wrapperActive);
        } 
      }

      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm(){
    const thisProduct = this;
    
    thisProduct.form.addEventListener('submit', function(e){
      e.preventDefault();
      thisProduct.processOrder();
    });
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    thisProduct.cartButton.addEventListener('click', function(e){
      e.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);

    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramID in thisProduct.data.params){
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramID];
      

      // for every option in this category
      for(let optionID in param.options){
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionID];
        const image = thisProduct.imageWrapper.querySelector('.' + paramID + '-' + optionID);

        if(formData.hasOwnProperty(paramID) && formData[paramID].includes(optionID)){
          if(!option.default){
            price += option.price;
          }
          if(image){
            image.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          if(option.default){
            price -= option.price;
          }
          if(image){
            image.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }
    
    thisProduct.priceSingle = price;

    /*multiply price by amount*/
    price = price * thisProduct.amountWidget.value;

    // update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;
  }

  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

    thisProduct.amountWidgetElem.addEventListener('update', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);


  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {
      name: thisProduct.data.name,
      id: thisProduct.id,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
    };

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);

    const productIngredients = {};

    // for every category (param)...
    for(let paramID in thisProduct.data.params){
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramID];

      productIngredients[paramID] = {
        label: param.label,
        options: {}
      };
      
      // for every option in this category
      for(let optionID in param.options){

        if(formData.hasOwnProperty(paramID) && formData[paramID].includes(optionID)){
          productIngredients[paramID].options[optionID] = optionID; 
        }
      }
    }
    return productIngredients;
  }
}

export default Product;