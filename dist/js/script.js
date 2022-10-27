/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      product: '.cart__order-summary li',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.setValue(thisWidget.input.value);

    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);

    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(e){
        e.preventDefault;
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(e){
        e.preventDefault;
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      if(thisWidget.value !== newValue && !isNaN(newValue) && (newValue >= settings.amountWidget.defaultMin) && (newValue <= settings.amountWidget.defaultMax)){
        thisWidget.value = newValue;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    announce(){
      const thisWidget = this;

      const event = new CustomEvent('update', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];
      

      thisCart.getElements(element);
      thisCart.initActions();
      
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('update', function(){
        thisCart.updateCart();
      });

      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(e){
        e.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct){
      const thisCart = this;

      /*generate HTML of product in cart*/
      const generatedHTML = templates.cartProduct(menuProduct);
 
      /*create element using utils.createDOMFromHTML*/
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.generatedDOM = generatedDOM;

      /*add generatedDOM to menu*/
      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log(thisCart.products);

      thisCart.updateCart();
    }

    updateCart(){
      const thisCart = this;

      let deliveryFee = 0;
      let totalNumber = 0;
      let subtotalPrice = 0;

      for(let product of thisCart.products){
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }

      if(totalNumber > 0){
        deliveryFee = settings.cart.defaultDeliveryFee;
      } 

      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
      for (let price of thisCart.dom.totalPrice){
        thisCart.totalPrice = subtotalPrice + deliveryFee;
        price.innerHTML = thisCart.totalPrice;
      }
      thisCart.totalNumber = totalNumber;
      thisCart.subtotalPrice = subtotalPrice;
      thisCart.deliveryFee = deliveryFee;
      thisCart.dom.totalNumber.innerHTML = totalNumber;
    }

    remove(product){
      const thisCart = this;

      const indexOfProduct = thisCart.products.indexOf(product);
      thisCart.products.splice(indexOfProduct, 1);
      product.dom.wrapper.remove();

      thisCart.updateCart();
      
    }

    sendOrder(){
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;

      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };

      console.log(payload);

      for(let prod of thisCart.products){
        payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
        });
    }
  }

  class CartProduct{
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.priceSingle * menuProduct.amount;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWrapper = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWrapper);

      thisCartProduct.dom.amountWrapper.addEventListener('update', function(){ 
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct:thisCartProduct,
        }
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(e){
        e.preventDefault;
      });

      thisCartProduct.dom.remove.addEventListener('click', function(e){
        e.preventDefault;
        thisCartProduct.remove();
      });
    }

    getData(){
      const thisCartProduct = this;

      const neededInformation = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      };

      return neededInformation;
    }

  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);

          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });

      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },
  };


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

      app.cart.add(thisProduct.prepareCartProduct());
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

  app.init();
}
