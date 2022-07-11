# HTML Selection Element

A web component that provides an interface for users to select its child 
elements, much like the `<select>` element. Children can be any HTMLElement, 
or other web components.

Selections can be made using a pointing device (mouse, finger, pen etc.) or, 
once the component has focus, using the arrow keys on a keyboard. Single and 
multiple selections are supported. The current selection can be set or retrieved
using the properties documented below, and events are fired when the user 
changes the selection.

## Use

Load the JavaScript directly into your page using a `<script>` tag, or import
the module via `import`. The component doesn't automaticall register itself with 
the custom element registry so you'll need to handle that:

```js
import SelectionElement from './path/to/selectionelement.esm.min.js';
customElements.define('my-selector', SelectionElement);
```

You can then use the component in your pages:

```html
<my-selector>
  <img src="1.jpg">
  <img src="2.jpg">
  <img src="3.jpg">
</my-selector>
```

## Styling

The component keeps all styling in the light DOM so you have full control 
over item layout, selection styles etc. Basic styling is provided out of the 
box, but can be easily overidden.

When a child is selected a `data-selected` attribute is added to the element. If 
a selected child is deselected, the attribute is removed. You can use this 
attribute as a CSS hook to style your selected elements:

```css
[data-selected] {
  outline: 3px dotted hotpink;
}
```

You can also add this attribute to the child elements to set the initial 
selection state.

## Example

Here's an example of a simple image viewer:

```html
<style>
  #gallery {
    display: flex;
    flex-wrap: nowrap;
    overflow: auto;
  }
</style>

<img id="preview" src="1.jpg">

<kc-select id="gallery">
  <img src="1.jpg" data-selected>
  <img src="2.jpg">
  <img src="3.jpg">
</kc-select>

<script type="module">
  // Import the component
  import SelectionElement from './path/to/selection-element.esm.min.js';
  customElements.define('kc-select', SelectionElement);

  // Select the relevant elements
  const preview = document.getElementById('preview');
  const gallery = document.getElementById('gallery');

  // When the gallery selection changes, update the preview
  gallery.addEventListener('change', event => {
    preview.src = gallery.selectedChild?.src;
  });
</script>
```

## FAQs

### Can I change the name of the attribute used to mark elements as selected?
Yes. The attribute name is exposed via the `selectedAttributeName` static 
property. To change the name, just extend the class and override the getter:

```js
class MyCustomSelectionElement extends SelectionElement {
  static get selectedAttributeName() {
    return 'data-foo';
  }
}
```

---

# `SelectionElement` Documentation


# SelectionElement

Extends [`HTMLElement`](#). A web component that provides an interface for users to select its child elements, much like the `<select>` element. Children can be any HTMLElement, or other web components. 

## Properties

### `length` (Read only)

A [`Number`](#) reflecting the total count of selectable child elements contained by this element. 

### `selectedChildren` (Read only)

An array of [`HTMLElement`](#) objects reflecting the children contained by this element that are currently selected. 

### `selectedIndex`

A [`Number`](#) reflecting the index of the first selected item or `−1` if no items are currently selected. Can be set, to change the selection. 

### `selectedChild`

A [`HTMLElement`](#) or [`null`](#) reflecting the first selected element. Returns `null` if no elements are selected. Can be set, to change the selection. 

### `selectedAttributeName` (Static) (Read only)

A [`String`](#) reflecting the attribute name to be used for marking an element as selected. 

## Events

### `change`

A [`UIEvent`](#). Fired when the user modifies the current selection. 

### `input`

A [`UIEvent`](#). Fired when the user modifies the current selection. 
