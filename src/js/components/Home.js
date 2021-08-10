import { templates, select } from '../settings.js';
import app from '../app.js';


class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initWidgets();
    thisHome.jumpToSubpage();
  }


  render(element) {
    const thisHome = this;

    const generatedHTML = templates.homeWidget();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.order = element.querySelector(select.home.order);
    thisHome.dom.book = element.querySelector(select.home.book);

  }

  initWidgets() {
    const thisHome = this;

    setTimeout(() => {
      thisHome.element = document.querySelector('.carousel');
      thisHome.flkty = new Flickity(thisHome.element, {
        wrapAround: true,
        autoPlay: 4000,
        cellAlign: 'left',
        contain: true,
        prevNextButtons: false,
        pageDots: false,
      });
    }, 2000);
  }

  jumpToSubpage() {
    const thisHome = this;

    thisHome.dom.order.addEventListener('click', function(){
      app.activatePage('order');
    });
   
    thisHome.dom.book.addEventListener('click', function(){
      app.activatePage('booking');
    });
  }
}

export default Home;