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
export default class SelectionElement extends HTMLElement {

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
  }


  /**
   * The total count of selectable child elements contained by this element.
   * 
   * @type {Number}
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
   * @param {UIEvent} event - The `focusin` event
   */
  #handleFocusIn() {
  
    /** @param {KeyboardEvent} event - The `keydown` event  */
    const keyHandler = (event) => {
      const { key } = event;

      let { selectedIndex: newSelectionIndex } = this;

      if (key === 'Home') {
        newSelectionIndex = 0;
      } else if (key === 'End') {
        newSelectionIndex = this.children.length - 1;
      } else if (key === 'PageUp') {
        const index = this.#getPreviousNonvisibleChildIndex();
        if (index > -1) {
          newSelectionIndex = index;
        }
      } else if (key === 'PageDown') {
        const index = this.#getNextNonvisibleChildIndex();
        if (index > -1) {
          newSelectionIndex = index;
        }
      } else if (key === 'ArrowRight' || key === 'ArrowDown') {
        if (newSelectionIndex < this.length - 1) {
          newSelectionIndex++;
        }
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        if (newSelectionIndex > 0) {
          newSelectionIndex--;
        }
      } else {
        return;
      }

      event.preventDefault();

      if (newSelectionIndex !== this.selectedIndex) {
        this.selectedIndex = newSelectionIndex;
        this.#scrollSelectionIntoView();
        this.#notifySelectionChange();
      }
    }

    document.addEventListener('keydown', keyHandler);

    this.addEventListener('focusout', (event) => {
      document.removeEventListener('keydown', keyHandler);
    }, { once: true } );

  }


  /**
   * Handler for pointer based events. Used to select and deselect items using
   * a pointer.
   * 
   * @param {PointerEvent} event - The `pointerdown` event
   */
  #handlePointerDown(event) {
    let { target, shiftKey } = event;

    // If the selection target is this element then a child wasn't clicked.
    if (target === this) {
      return false;
    }

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


  /**
   * Returns the first child element that falls outside the visible scroll area 
   * of the scrollbox. The current selected index is used as the reference.
   * 
   * @returns {number} The element index
   */
  #getNextNonvisibleChildIndex() {

    const { selectedIndex } = this;
    if (selectedIndex == -1) {
      return -1;
    }
  
    const containerBounds = this.getBoundingClientRect();
    const selectionBounds = this.children[selectedIndex].getBoundingClientRect();
  
    const pageBounds = DOMRect.fromRect(containerBounds);
    pageBounds.y += selectionBounds.top - containerBounds.top;
    pageBounds.x += selectionBounds.left - containerBounds.left;
  
    for (let c = selectedIndex + 1; c < this.children.length; c++) {
      const bounds = this.children[c].getBoundingClientRect();
      if (!this.#rectContains(pageBounds, bounds)) {
        return c;
      }
    }
  
    return this.children.length - 1;
  }


  /**
   * Returns the first child element that falls outside the visible scroll area 
   * of the scrollbox. The current selected index is used as the reference.
   * 
   * @returns {number} The element index
   */
  #getPreviousNonvisibleChildIndex() {
    const { selectedIndex } = this;
    if (selectedIndex == -1) {
      return -1;
    }
  
    const containerBounds = this.getBoundingClientRect();
    const selectionBounds = this.children[selectedIndex].getBoundingClientRect();
  
    const pageBounds = DOMRect.fromRect(containerBounds);
    pageBounds.y -= containerBounds.bottom - selectionBounds.bottom;
    pageBounds.x -= containerBounds.right - selectionBounds.right;
  
    for (let c = selectedIndex - 1; c >= 0; c--) {
      const bounds = this.children[c].getBoundingClientRect();
      if (!this.#rectContains(pageBounds, bounds)) {
        return c;
      }
    }
  
    return 0;
  }


  /**
   * Checks if a rectangle contains another
   * 
   * @param {DOMRect} a A rectangle defining the outer bounds
   * @param {DOMRect} b A rectangle to check
   * @returns {boolean} 
   */
  #rectContains = (a, b) => {
    return (
      b.left >= a.left &&
      b.right <= a.right &&
      b.top >= a.top &&
      b.bottom <= a.bottom 
    )
  }


}
