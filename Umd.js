import "./zip.min.js";

zip.configure({useWebWorkers: true});

export default class Umd {
    constructor() {
        this._zip = new zip.TextReader; //new zip.TextReader("");
        this._umlname = "contents.uml"; // being stored for future
        this._components = [];
        this._umlcontents = ""; // this is a string
        this._filename = "untitled.umd"; // filename of the zipfile
        this._password = ""; // if password has been set
        this._readonly = false; // property of the umd file
        this._isEdited = true; // is the file being edited. set to true for new docs
        this._hasChanged = false; //indicates changes have been made
    }

    // getters and setters

    get filename() {
        return this._filename;
    }

    set filename(n) {
        // check if extension exists
        const _arr = n.split(".");
        this._filename = `${_arr[0]}.umd`;
    }

    set password(p) {
        this._password = p;
    }

    get readonly() {
        return this._readonly;
    }

    set readonly(bool) {
        this._readonly = bool;
    }

    get isEdited() {
        return this._isEdited;
    }

    set isEdited(bool) {
        this._isEdited = bool;
    }

    get hasChanged() {
        return this._hasChanged;
    }

    set hasChanged(bool) {
        this._hasChanged = bool;
        this.listener(this);
    }

    listener(val) {
    }

    registerListener(fn) {
        this.listener = fn;
    }

    get elements() {
        return this._generateElements();
    }

    // open using fileobj
    async openFile(fileobj, password) { // password can be optional
        // check if fileobj is null
        if (!fileobj) return Promise.reject("invalid-file");

        // pick name of umd from fileobj
        if (fileobj.name) {
            this._filename = fileobj.name;
        }
        else {
            this._filename = "untitled.umd";
        }
        // update password if sent via param
        if (password) {
            this._password = password;
        }
        // now process
        return new Promise(async (resolve, reject) => {
            try {
                // create new zip object using fileobject
                //this._zip = new zip.ZipReader(new zip.BlobReader(fileobj), {password: this._password});
                this._zip = new zip.ZipReader(new zip.BlobReader(fileobj), {password: this._password});
                // read list of zip content
                const _list = await this._zip.getEntries();
                // hold umlele
                let _umlele;
                // reset umlcontents as string
                this._umlcontents ="";
                // get uml file
                let _includearr = [];
                for (const _ele of _list) {
                    // check if of type uml
                    //
                    // get extension
                    const _ext = _ele.filename.split(".").pop().toLowerCase();
                    // store the uml file
                    if (_ext == "uml") { // read as text
                        _umlele = _ele;
                        this._umlcontents = await _ele.getData(
                            new TextWriter(),
                        );
                        _includearr.push({"filename": _ele.filename, "contents": this._umlcontents});
                    }
                    else { // read as blob
                        const _array = await _ele.getData(
                            new Uint8ArrayWriter(),
                        );
                        _includearr.push({"filename": _ele.filename, "contents": _array});
                    }
                }

                // first check uml file exists
                if (!_umlele) reject("invalid-umd");
                if (!this._umlcontents) reject("invalid umd");

                // convert to elements
                const _dom = this._stringToHTML(this._umlcontents);

                // get readonly status from uml element
                const _ro = _dom.querySelector("uml").getAttribute("data-readonly");
                if (_ro) {
                    this._readonly = JSON.parse(_ro);
                }
                else {
                    // currently set readonly to false by default
                    this._readonly = false;
                }
                const _eles = _dom.querySelector("uml").querySelectorAll("*");
                this._components = [];
                _eles.forEach(_ele => {
                    // create a json
                    let _jsn = {};
                    _jsn.no = this._components.length + 1;
                    _jsn.name = _ele.tagName.toLowerCase();
                    _jsn.data = { "source": _ele.getAttribute("data-source"), "content": _ele.getAttribute("data-content") };
                    if (_ele.getAttribute("data-aspect")) {
                        _jsn.data["aspect"] = _ele.getAttribute("data-aspect");
                    }
                    if (_jsn.data.source == "include") {
                        // extract content from path
                        const _ind =  _includearr.findIndex(ele => ele.filename == _ele.getAttribute("data-content"));
                        if(_ind != -1) {
                        const _arraybuffer = _includearr[_ind].contents;
                            _jsn.data.arraybuffer = _arraybuffer;
                        }
                        this._components.push(_jsn);
                    }
                    else {
                        this._components.push(_jsn);
                    }
                });
                // set flags
                this._isEdited = false;
                this.hasChanged = false;
                // end
                resolve("");
            }
            catch (err) {
                console.log(err);
                reject("password-required");
            }
        });
    }

    appendComponent(component) {
        return new Promise(async (resolve) => {
            // create a json
            let _jsn = {};
            _jsn.no = this._components.length + 1;
            _jsn.name = component.name;
            _jsn.data = {};
            _jsn.data.source = component.source;
            _jsn.data.content = component.content;
            if (component.aspect) {
                _jsn.data.aspect = component.aspect;
            }
            // check for include
            if (_jsn.data.source == "include" && component.file) {
                // read the contents of the file
                const _filebuffer = await this._readBuffer(component.file);

                // convert to uint8array
                const _arr = new Uint8Array(_filebuffer);

                // convert to blob and store
                _jsn.data.arraybuffer = _arr;

                // update component array
                this._components.push(_jsn);
            }
            else {
                this._components.push(_jsn);
            }
            //this.isEdited = true;
            this.hasChanged = true;
            resolve(_jsn.no);
        });
    }

    editComponent(component) {
        return new Promise(async (resolve) => {
            // read the json
            const _jsn = this._components[component.no - 1];
            _jsn.data.source = component.source;
            _jsn.data.content = component.content;
            if (_jsn.data.source == "include" && component.file) {
                // read the contents of the file
                const _filebuffer = await this._readBuffer(component.file);

                // convert to uint8array
                const _arr = new Uint8Array(_filebuffer);
                _jsn.data.arraybuffer = _arr;
            }
            //this.isEdited = true;
            this.hasChanged = true;
            resolve();
        });
    }

    moveComponent(no, direction) {
        const n = no;
        let s = n;
        if (direction == 'U') {
            if (n == 1) return;

            s = n - 1;
            const nindex = this._components.findIndex(component => component.no == n);
            const sindex = this._components.findIndex(component => component.no == s);

            this._components[nindex].no = s;
            this._components[sindex].no = n;
        }
        else if (direction == 'D') {
            if (n == this._components.length) return;

            s = n + 1;
            const nindex = this._components.findIndex(component => component.no == n);
            const sindex = this._components.findIndex(component => component.no == s);

            this._components[nindex].no = s;
            this._components[sindex].no = n;
        }
        this.hasChanged = true;
        this._components.sort(function (a, b) {
            return a.no - b.no
        });
    }

    deleteComponent(no) {
        // find the index
        const nindex = this._components.findIndex(component => component.no == no);
        if (nindex != -1) {
            // temporarily set the no to 0
            this._components.no = 0;
        }

        // now renum 
        this._components.forEach(_component => {
            if (_component.no > no) {
                _component.no--;
            }
        });
        delete this._components[nindex];
        // remove blank
        //this.isEdited = true;
        this.hasChanged = true;
        this._components = this._components.filter(function (el) { return el != null; });
    }

    async save() {
        return new Promise(async resolve => {
            // instantiate new object 
            //const _blobWriter = new zip.BlobWriter("application/zip");
            const _blobWriter = new zip.BlobWriter("application/zip");
            this._zip = new zip.ZipWriter(_blobWriter, {password: this._password});

            // first generate uml
            this._generateUml();
            // first add the uml to zip
            await this._zip.add("contents.uml", new zip.TextReader(this._umlcontents));

            // sort components
            this._components.sort(function (a, b) {
                return a.no - b.no
            });

            // loop through the components
            for(let i=0; i < this._components.length; i++) {
                const _component = this._components[i];
                // check for include
                if (_component.data.source == "include") {
                    //await this._zip.add(_component.data.content, new zip.Uint8ArrayReader(_component.data.arraybuffer));
                    await this._zip.add(_component.data.content, new zip.Uint8ArrayReader(_component.data.arraybuffer));
                }
            };
            // close the Zip
            await this._zip.close();
            const _blob = await _blobWriter.getData();
            // now create file object
            const file = new File([_blob], this._filename);
            this.isEdited = false;
            this.hasChanged = false;
            resolve(file);
        });
    }

    // internal methods
    _readBuffer(file) {
        return new Promise(resolve => {
            var fr = new FileReader();

            fr.onload = function (event) {
                resolve(event.target.result)
            };
            fr.readAsArrayBuffer(file);
        });
    }

    _readBlobAsText(blob) {
        return new Promise(resolve => {
            var fr = new FileReader();

            fr.onload = function (event) {
                resolve(event.target.result)
            };
            fr.readAsText(blob);
        });
    }

    _generateUml() {
        // sort the components
        this._components.sort(function (a, b) {
            return a.no - b.no
        });

        let _str = `<uml data-type="umd" data-readonly="${this._readonly}">`;
        for (let i = 0; i < this._components.length; i++) {
            const _component = this._components[i];
            const _name = _component.name;
            const _data = _component.data;
            _str += `<${_name}`;
            if (_data.source) {
                _str += ` data-source="${_data.source}"`;
            }
            if (_data.source == "include") {
                _str += ` data-content="${_data.content}"`;
            }
            else {
                _str += ` data-content="${_data.content}"`;
            }
            if (_data.aspect) {
                _str += ` data-aspect="${_data.aspect}"`;
            }
            _str += `></${_name}>`;
        }
        _str += "</uml>";
        this._umlcontents = _str;
    }

    _generateElements() {
        let _eles = [];
        this._components.sort(function (a, b) {
            return a.no - b.no
        });
        this._components.forEach(_component => {
            const _ele = document.createElement(_component.name);
            _ele.setAttribute("data-no", _component.no);
            _ele.setAttribute("data-source", _component.data.source);
            if (_component.data.aspect) {
                _ele.setAttribute("data-aspect", _component.data.aspect);
            }
            if (_component.data.content) {
                _ele.setAttribute("data-content", _component.data.content);
            }
            switch (_component.data.source) {
                case "embed":
                    _ele.setAttribute("data-url", _component.data.content);
                    break;
                case "include":
                    if (_component.data.arraybuffer) {
                        const _blob = new Blob([_component.data.arraybuffer]);
                        const _eleurl = URL.createObjectURL(_blob);
                        _ele.setAttribute("data-url", _eleurl);
                    }
                    else {
                        _ele.setAttribute("data-url", _component.data.url)
                    }
                    break;
            }
            _eles.push(_ele);
        });
        return _eles;
    }

    // helper methods
    _support() {
        if (!window.DOMParser) return false;
        var parser = new DOMParser();
        try {
            parser.parseFromString("x", "text/html");
        } catch (err) {
            return false;
        }
        return true;
    };

    _stringToHTML(str) {
        // If DOMParser is supported, use it
        if (this._support) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(str, "text/html");
            return doc.body;
        }

        // Otherwise, fallback to old-school method
        var dom = document.createElement("div");
        dom.innerHTML = str;
        return dom;
    };
}