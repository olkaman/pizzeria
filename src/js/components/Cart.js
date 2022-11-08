import { settings, select, classNames, templates } from './../settings.js';
import { utils } from './../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
      select.cart.toggleTrigger
    );
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
      select.cart.productList
    );
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
      select.cart.deliveryFee
    );
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
      select.cart.subtotalPrice
    );
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(
      select.cart.totalPrice
    );
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
      select.cart.totalNumber
    );
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(
      select.cart.address
    );
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('update', function () {
      thisCart.updateCart();
    });

    thisCart.dom.productList.addEventListener('remove', function (event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (e) {
      e.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct) {
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

  updateCart() {
    const thisCart = this;

    let deliveryFee = 0;
    let totalNumber = 0;
    let subtotalPrice = 0;

    for (let product of thisCart.products) {
      totalNumber += product.amount;
      subtotalPrice += product.price;
    }

    if (totalNumber > 0) {
      deliveryFee = settings.cart.defaultDeliveryFee;
    }

    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    for (let price of thisCart.dom.totalPrice) {
      thisCart.totalPrice = subtotalPrice + deliveryFee;
      price.innerHTML = thisCart.totalPrice;
    }
    thisCart.totalNumber = totalNumber;
    thisCart.subtotalPrice = subtotalPrice;
    thisCart.deliveryFee = deliveryFee;
    thisCart.dom.totalNumber.innerHTML = totalNumber;
  }

  remove(product) {
    const thisCart = this;

    const indexOfProduct = thisCart.products.indexOf(product);
    thisCart.products.splice(indexOfProduct, 1);
    product.dom.wrapper.remove();

    thisCart.updateCart();
  }

  sendOrder() {
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

    for (let prod of thisCart.products) {
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
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });
  }
}

export default Cart;
