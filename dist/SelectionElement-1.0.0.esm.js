const createCSS = (selectedAttrName) => `
::slotted([${selectedAttrName}]){
  outline: 3px solid #ccc;
}
:host(:not([hidden])) {
  display: inline-flex;
  gap:3px
}
:host{
  border: 1px solid gray;
  border-radius: 3px;
  padding: 3px
}
:host(:focus-within) ::slotted([${selectedAttrName}]) {
  outline-color: #0063e1;
}
`;


/**
 * Fired when the user modifies the current selection.
 * 
 * @event change
 * @type {UIEvent}
 */

/**
 * Fired when the user modifies the current selection.
 * 
 * @event input
 * @type {UIEvent}
 */

/**
 * A web component that provides an interface for users to select its child 
 * elements, much like the `<select>` element. Children can be any HTMLElement, 
 * or other web components.
 */
class SelectionElement extends HTMLElement {

  #focusInHandler;
  #pointerDownHandler;
  #allowMultipeSelections = false;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `<style>${createCSS(this.constructor.selectedAttributeName)}</style><slot/>`;
    this.#focusInHandler = this.#handleFocusIn.bind(this);
    this.#pointerDownHandler = this.#handlePointerDown.bind(this);
    this.tabIndex = "0";
    console.log(this.constructor.selectedAttributeName);
  }


  /**
   * The total count of selectable child elements contained by this element.
   * 
   * @type {Number}
   * 
   * blah
   */
  get length() {
    return this.children.length;
  }


  /**
   * The children contained by this element that are currently selected.
   * 
   * @type {Array<HTMLElement>}
   */
  get selectedChildren()  {
    return [...this.children].filter(child => this.#isSelected(child));
  }


  /** 
   * The index of the first selected item or `−1` if no items are currently 
   * selected. Can be set, to change the selection.
   * 
   * @type {Number}
   */
  // The selectedIndex IDL attribute, on getting, must return the index of the 
  // first option element in the list of options in tree order that has its 
  // selectedness set to true, if any. If there isn't one, then it must return 
  // −1.
  get selectedIndex() {
    const { children } = this;
    for (let index = 0; index < children.length; index++) {
      if (this.#isSelected(children[index])) {
        return index;
      }
    }
    return -1;
  }

  // On setting, the selectedIndex attribute must set the selectedness of all 
  // the option elements in the list of options to false, and then the option 
  // element in the list of options whose index is the given new value, if any, 
  // must have its selectedness set to true and its dirtiness set to true.
  set selectedIndex(value) {
    const { children } = this;
    this.#clearSelection();
    if (value >= 0 && value < children.length) {
      this.#addToSelection(children[value]);
    }
  }


  /**
   * The first selected element. Returns `null` if no elements are selected.
   * Can be set, to change the selection.
   * 
   * @type {HTMLElement|null}
   */
  get selectedChild() {
    const { selectedIndex } = this;
    if (selectedIndex > -1) {
      return this.children[selectedIndex];
    }
    return null;
  }

  set selectedChild(element) {
    const { children } = this;
    this.#clearSelection();
    for (let index = 0; index < children.length; index++) {
      if (children[index] === element) {
        this.#addToSelection(element);
        break;
      }
    }
  }


  /**
   * The attribute name to be used for marking an element as selected.
   * @type {String}
   */
  static get selectedAttributeName() {
    return 'data-selected';
  }


  static get observedAttributes() {
    return ['multiple'];
  }


  connectedCallback() {
    this.addEventListener('focusin', this.#focusInHandler);
    this.addEventListener('pointerdown', this.#pointerDownHandler);
  }


  disconnectedCallback() {
    this.removeEventListener('focusin', this.#focusInHandler);
    this.removeEventListener('pointerdown', this.#pointerDownHandler);
  }


  attributeChangedCallback(attr, oldValue, newValue) {
    if (attr === 'multiple') {
      // If we're removing the `multiple` attribute and the element has more 
      // than one selected option then we fix up the selection status.
      if (newValue === null) {
        const { selectedIndex } = this;
        if (selectedIndex > -1) {
          this.#clearSelection();
          this.#addToSelection(this.children[selectedIndex]);
        }
      }
      this.#allowMultipeSelections = newValue !== null;
    }
  }


  /**
   * Marks an element as part of the selection.
   * 
   * @param {HTMLElement} element 
   */
  #removeFromSelection(element) {
    element.removeAttribute(this.constructor.selectedAttributeName);
  }


  /**
   * Unmarks an element as part of the selection.
   * 
   * @param {HTMLElement} element 
   */
  #addToSelection(element) {
    element.setAttribute(this.constructor.selectedAttributeName, '');
  }


  /**
   * Unmarks all elements in the selection.
   * 
   * @param {HTMLElement} element 
   */
  #clearSelection() {
    this.selectedChildren.forEach(element => this.#removeFromSelection(element));
  }


  /**
   * Checks to see if an element is marked for selection
   * @param {HTMLElement} element 
   * @returns {Boolean}
   */
  #isSelected(element) {
    return element.hasAttribute(this.constructor.selectedAttributeName);
  }


  /**
   * Scrolls the currently selected element into view.
   */
  #scrollSelectionIntoView() {
    if (!this.selectedChild) {
      return;
    }
    this.selectedChild.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    });
  }


  /**
   * Dispatches DOM events
   */
  #notifySelectionChange() {
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }


  /**
   * Event handler for dynamically binding keyboard control to the element when
   * it receives focus and unbinding when focus is lost. 
   * 
   * @param {UIEvent} [event=5] - The `focusin` event
   */
  #handleFocusIn() {
    this.addEventListener('focusout', event => {
      document.removeEventListener('keydown', keyHandler);
    }, { once: true } );
  
    const keyHandler = event => {
      const { key } = event;
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        if (this.selectedIndex < this.length - 1) {
          this.selectedIndex++;
          this.#scrollSelectionIntoView();
          this.#notifySelectionChange();
          event.preventDefault();
        }
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
          this.#scrollSelectionIntoView();
          this.#notifySelectionChange();
          event.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', keyHandler);
  }


  /**
   * Handler for pointer based events. Used to select and deselect items using
   * a pointer.
   * 
   * @param {PointerEvent} event - The `pointerdown` event
   */
  #handlePointerDown(event) {
    let { target, shiftKey } = event;

    if (target.parentElement !== this) {
      target = target.parentElement;
    }

    if (event.defaultPrevented) {
      return false;
    }

    if (this.#allowMultipeSelections && shiftKey) {
      if (this.#isSelected(target)) {
        this.#removeFromSelection(target);
        this.#notifySelectionChange();
      } else {
        this.#addToSelection(target);
        this.#notifySelectionChange();
      }
    } else {
      if (this.#isSelected(target)) {
        return false;
      }
      this.#clearSelection();
      this.#addToSelection(target);
      this.#notifySelectionChange();
    }
  }

}

export { SelectionElement as default };
