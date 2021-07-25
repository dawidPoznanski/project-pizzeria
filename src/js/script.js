/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';
  'eslint';

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
        input: 'input.amount', 
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    
    cart: {
      productList: '.cart__order-summary',
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
    
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    
    cart: {
      wrapperActive: 'active',
    },
    
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, 
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
    
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
 
  };
  
  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;
      
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAmountWidget();
      thisProduct.initOrderForm();
      thisProduct.initAccordion();
      

      //console.log('New Product', thisProduct);
    }
    renderInMenu(){
      const thisProduct = this;

      
      const generatedHTML = templates.menuProduct(thisProduct.data);
     
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      
      const menuContainer = document.querySelector(select.containerOf.menu);
   
      menuContainer.appendChild(thisProduct.element);
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

      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        const activeProduct = document.querySelectorAll(select.all.menuProductsActive);

        for(let active of activeProduct){
          if(active!== thisProduct.element){
            active.classList.remove(classNames.menuProduct.wrapperActive);
          }
        }
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }
    initOrderForm(){
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder() {
      const thisProduct = this;
    
      const formData = utils.serializeFormToObject(thisProduct.form);
      

      let price = thisProduct.data.price;

      for(let paramId in thisProduct.data.params) {
        
        const param = thisProduct.data.params[paramId];
        
        for(let optionId in param.options) {       
          const option = param.options[optionId];
          console.log('optionId', optionId, 'option', option);

          const optionSelected = (formData[paramId] && formData[paramId].includes(optionId));
          
          if(optionSelected){
            if(!option.default == true) {
              price += option.price;
            }
          } else {
            if(option.default == true) {
              price-= option.price;
            }
          }
          
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          

          if(optionImage){
            if(optionSelected){
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            }
            else{
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value; 
      thisProduct.priceElem.innerHTML = price;
    }
    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }
    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {};
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.params = thisProduct.prepareCartProductParams();
      return productSummary;
    }
    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
    
      // for every category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
    
        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        };
    
        // for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
    
          if(optionSelected) {
            // option is selected!
            params[paramId].options[optionId] = option.label;
          }
        }
      }
    
      return params;
    }
  }
  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      
      
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
      
      
      
      //console.log('AmountWidget:', thisWidget);
      //console.log('constructor arguments:', element);
    }
    getElements(element){
      const thisWidget = this;
    
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      //thisWidget.input.value = thisWidget.value;
    
      /* TODO: Add validation */

      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= (settings.amountWidget.defaultMin) && newValue <= (settings.amountWidget.defaultMax)) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      

      
      thisWidget.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce () {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
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

      

      //console.log('New Cart', thisCart);
    }
    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);  
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    }
    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = element.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = element.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
      thisCart.dom.form = element.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      
    }
    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log('thisCart.products', thisCart.products);

      thisCart.dom.productList.appendChild(generatedDOM);
      console.log('adding product', menuProduct);

      /*thisCart.products.push(menuProduct, generatedDOM);
      console.log('thisCart.products', thisCart.products);*/

      
      thisCart.update();
    }
    update() { 
      const thisCart = this;
      
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subTotalPrice = 0;

      for(let product of thisCart.products) {
        thisCart.totalNumber += product.amount; 
        thisCart.subTotalPrice += product.price; 
      }
      if(thisCart.totalNumber === 0) {
        thisCart.totalPrice = 0;
        thisCart.deliveryFee = 0;
      } else {
        thisCart.totalPrice = thisCart.subTotalPrice + thisCart.deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = settings.cart.defaultDeliveryFee;
        for(let selector of thisCart.dom.totalPrice){
          selector.innerHTML = thisCart.totalPrice;
        }
        console.log('totalPrice', thisCart.totalPrice);
        console.log('totalNumber', thisCart.totalNumber);
        console.log('subTotalPrice', thisCart.subTotalPrice);
        console.log('deliveryFee', thisCart.deliveryFee);

        thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
        thisCart.dom.subTotalPrice.innerHTML = thisCart.subTotalPrice;
        thisCart.dom.totalPrice.innerHTML = thisCart.subTotalPrice + thisCart.deliveryFee;
        thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      }
    }
    remove(CartProduct){

      const thisCart = this;

      const indexOfProduct = thisCart.products.indexOf(CartProduct);

      thisCart.products.splice(indexOfProduct, 1);
      CartProduct.dom.wrapper.remove();
      thisCart.update();
    }
    sendOrder(){
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;

      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subTotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      for(let prod of thisCart.products){
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content Type': 'application/json',
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
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      //thisCartProduct.amountWidget = menuProduct.amountWidget;
      thisCartProduct.params = menuProduct.params;
      

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      // console.log('New cart items',thisCartProduct);
    }
    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
      
    }
    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function (event){
        event.preventDefault();
        thisCartProduct.remove();
        
      });
      console.log('delete', thisCartProduct.remove());
    }
    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        }
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    getData(){
      const thisCartProduct = this;

      const products = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amountWidget,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        params: thisCartProduct.params,
      };
      return products;
    }
  }
  const app = {
    initMenu: function(){
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, 
          thisApp.data.products[productData]);
      }
      const testProduct = new Product();
      console.log('testProduct', testProduct);
    },
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
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

          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;
          /* execute initMenu method */
          thisApp.initMenu();
        });
      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initCart();
      //thisApp.initMenu();
      //thisApp.initAccordion();
    },
  };
  //app.initData();
  //app.initMenu();
  app.init();
}
