# Umd

> This is the Class file for the base UMD Object.

## What does it do
Programmatically, developers can:

- Creates an UMD object
- Add a Component
- Move a Component across the list
- Remove a Component
- Generate the UMD file object

Normally, most developers will **not be required** to use this Class. The `umd-viewer-component` is webcomponent library that is used to embed an UMD Viewer in a web application. That library internally uses this class.

## Dependencies

This class uses the zip utility developed by **Gildas**(*gildas-lormeau*). The rep is available at [gildas-lormeau/zip.js](https://github.com/gildas-lormeau/zip.js)

## Creating an object

This creates a new Umd object and set default values (*see below*).
```javascript
    const _umd = new Umd();
```

## Getters and Setters
The following getters and setters are available:

1. **Filename**

By default the filename is set to: `untitled.umd`
```javascript
    // to set filename
    _umd.filename = 'test'; // extension will automatically get appended

    // to retrieve filename
    const _filename = _umd.filename;
```

2. **Password**

By default *no password* is set.
```javascript
    // to set password
    _umd.password = 'umd is wow'; // case sensitive
    // only setter available
```

3. **Readonly**

By default it is set to `false`
```javascript
    // to set boolean value
    _umd.readonly = true; 

    // to retrieve current setting
    const _readonlysetting = _umd.readonly;
```

4. **IsEdited**

To indicate if the file is **being edited**. New docs are set to `true`. Opened docs are set to `false`
```javascript
    // to set boolean value
    _umd.isEdited = true; 

    // to retrieve current status
    const _status = _umd.isEdited;
```

5. **hasChanged**

To indicate if the file in memory has changed. This is automatically changed based on calling one of the methods that changes the umd contents.
```javascript
    // to get value
    const _changed = _umd.hasChanged; 
```

6. **Get Elements**

This property can be used to get the elements (json array) of the UMD. This array is used to build the DOM for the display of the elements. The order of the elements are as specified by the creator of the UMD.
```javascript
    const _eles = _umd.elements;
    // _eles holds the umd-tags
    //
    // <umd-image-component data-source="include" data-content="sample.png">
```

## Listener

Developers can register a listener which will be triggered when a change has occured viz. `hasChanged` 

```javascript
    _umd.registerListener(val => {
        // use val appropriately
        // for example to display the filename with a * 
        // to indicate that it has been edited
    })
```

## JSON structure

Developers need to understand the JSON structure of a component when `appending` or `modifying` them. The structure is as follows:

```json
{
    "no": 1,
    "name": "image", 
    "source": "include", 
    "file": fileobj 
    "content": "sample.png", 
    "aspect": "16:9" 
}
```

### Notes:

1. **no**: Must be blank when appending. Must be the existing number of component when editing. Starts with 1 not 0.
2.  **name**: This is the Component name. Must be one of `text`, `image`, `audio`, `video`, `md`, `pdf`, `form`.
3. **source**: This indicates whether the contents of the component have been "included" in the UMD or whether to embed the contents from a URL. The supported values are: `include` or `embed`.
4. **file**: This element in the JSON is required if the source is set to `include`. It is the File Object of the included file.
5. **contents**: This holds the name of the file in the case of an included source and the url of the file in the case of an embedded component.
6. **aspect**: This is applicable only for the `video` component. It is used to set the aspect-ratio of the video. By default it is set to "16:9". It is a string and can be set to other values like: "1:1"


## Methods
The creator and viewer programs call the following methods.

1. **Open File**

### Usage
```javascript
    _umd.openFile(fileobj, password)
        .then(_ => {
            // do something
        })
        .catch(err => {
            // process error
        });
```        

### Notes
1. fileobj is of type `File`. password is case-sensitive `string`.
2. if password is required, it will throw err `password-required`. Consequently, this will require the user to share the password when the `openFile` method can be called again.
3. If the UMD file is on an internet server, the developer must fetch it and pass the file-object to this function.

2. **Append Component**

### Usage
```javascript
    _umd.appendComponent(json)
        .then(n => {
            // returns the serial number 
            //
            // for example it can be used 
            // to get the new component
            const _ele = _umd.elements[n-1];
            ....
        })
        .catch(err => {
            // process error
        });
```        

3. **Edit Component**

### Usage
```javascript
    _umd.editComponent(json)
        .then(_ => {
            // update UI
        })
        .catch(err => {
            // process error
        });
```        

4. **Move Component**

### Usage
```javascript
    _umd.moveComponent(no, direction);
```      

#### Notes
1. **no**: the serial number of the component to be moved.
2. **direction**: takes values: `up` or `down`.

5. **Delete Component**

### Usage
```javascript
    _umd.deleteComponent(no)
        .then(_ => {
            // update UI
        })
        .catch(err => {
            // process error
        })
```      
